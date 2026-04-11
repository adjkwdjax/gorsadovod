from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.utils.text import slugify
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from datetime import date
from decimal import Decimal, InvalidOperation

from .models import (
    Article,
    Club,
    DiaryEntry,
    DiaryPlant,
    DirectMessage,
    ForumPost,
    ForumTopicNotification,
    ForumTopicSubscription,
    ForumTopic,
    MapPoint,
    MarketplaceListing,
    TradeExchange,
    TradeReview,
    UserProfile,
)


def _stub(name, **payload):
    return {"stub": True, "endpoint": name, **payload}


def _user_payload(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    full_name = user.get_full_name().strip()

    return {
        "id": str(user.id),
        "username": full_name or user.get_username(),
        "email": user.email,
        "rating": float(profile.rate),
        "clubs": [{"id": str(club.id), "name": club.name} for club in user.clubs.all()],
        "createdAt": user.date_joined.isoformat(),
    }


def _user_short_payload(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    full_name = user.get_full_name().strip()
    return {
        "id": str(user.id),
        "username": full_name or user.get_username(),
        "rating": float(profile.rate),
    }


def _session_token(request):
    if not request.session.session_key:
        request.session.save()
    return request.session.session_key


def _bearer_session_user(request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    session_key = auth_header.replace("Bearer ", "", 1).strip()
    if not session_key:
        return None

    session = Session.objects.filter(session_key=session_key, expire_date__gte=timezone.now()).first()
    if not session:
        return None

    data = session.get_decoded()
    user_id = data.get("_auth_user_id")
    if not user_id:
        return None

    User = get_user_model()
    return User.objects.filter(pk=user_id).first()


def _resolve_request_user(request):
    if request.user.is_authenticated:
        return request.user
    return _bearer_session_user(request)


def _forum_topic_payload(topic, current_user=None, subscribed_topic_ids=None):
    replies_count = getattr(topic, "replies_count", None)
    if replies_count is None:
        replies_count = topic.posts.count()

    is_subscribed = False
    if current_user:
        if subscribed_topic_ids is not None:
            is_subscribed = topic.id in subscribed_topic_ids
        else:
            is_subscribed = ForumTopicSubscription.objects.filter(topic=topic, user=current_user).exists()

    return {
        "id": str(topic.id),
        "title": topic.title,
        "description": topic.description,
        "authorId": str(topic.author_id),
        "authorName": topic.author.get_full_name().strip() or topic.author.get_username(),
        "createdAt": topic.created_at.isoformat(),
        "repliesCount": replies_count,
        "isClosed": topic.is_closed,
        "isSubscribed": is_subscribed,
    }


def _forum_post_payload(post):
    return {
        "id": str(post.id),
        "topicId": str(post.topic_id),
        "content": post.content,
        "authorId": str(post.author_id),
        "authorName": post.author.get_full_name().strip() or post.author.get_username(),
        "createdAt": post.created_at.isoformat(),
    }


def _forum_notification_payload(notification):
    content = (notification.post.content or "").strip()
    if len(content) > 120:
        content = f"{content[:117]}..."

    return {
        "id": str(notification.id),
        "topicId": str(notification.topic_id),
        "topicTitle": notification.topic.title,
        "postId": str(notification.post_id),
        "postContentPreview": content,
        "isRead": notification.is_read,
        "createdAt": notification.created_at.isoformat(),
    }


def _direct_message_payload(message):
    return {
        "id": str(message.id),
        "senderId": str(message.sender_id),
        "senderName": message.sender.get_full_name().strip() or message.sender.get_username(),
        "recipientId": str(message.recipient_id),
        "recipientName": message.recipient.get_full_name().strip() or message.recipient.get_username(),
        "content": message.content,
        "isRead": message.is_read,
        "createdAt": message.created_at.isoformat(),
    }


def _marketplace_payload(listing):
    category_map = {
        MarketplaceListing.CATEGORY_GIVEAWAY: "Отдам даром",
        MarketplaceListing.CATEGORY_SWAP: "Обмен",
        MarketplaceListing.CATEGORY_WANTED: "Ищу",
    }

    return {
        "id": str(listing.id),
        "title": listing.title,
        "description": listing.description,
        "category": category_map.get(listing.category, "Ищу"),
        "authorId": str(listing.author_id),
        "authorName": listing.author.get_full_name().strip() or listing.author.get_username(),
        "createdAt": listing.created_at.isoformat(),
        "imageUrl": listing.image_url or None,
        "location": listing.location or None,
        "isActive": listing.is_active,
    }


def _trade_exchange_payload(exchange):
    return {
        "id": str(exchange.id),
        "initiatorId": str(exchange.initiator_id),
        "initiatorName": exchange.initiator.get_full_name().strip() or exchange.initiator.get_username(),
        "counterpartyId": str(exchange.counterparty_id),
        "counterpartyName": exchange.counterparty.get_full_name().strip() or exchange.counterparty.get_username(),
        "itemsFromInitiator": exchange.items_from_initiator,
        "itemsFromCounterparty": exchange.items_from_counterparty,
        "status": exchange.status,
        "confirmedByInitiator": exchange.confirmed_by_initiator,
        "confirmedByCounterparty": exchange.confirmed_by_counterparty,
        "completedAt": exchange.completed_at.isoformat() if exchange.completed_at else None,
        "createdAt": exchange.created_at.isoformat(),
    }


def _trade_review_payload(review):
    return {
        "id": str(review.id),
        "exchangeId": str(review.exchange_id),
        "authorId": str(review.author_id),
        "authorName": review.author.get_full_name().strip() or review.author.get_username(),
        "targetId": str(review.target_id),
        "targetName": review.target.get_full_name().strip() or review.target.get_username(),
        "rating": review.rating,
        "comment": review.comment,
        "createdAt": review.created_at.isoformat(),
    }


def _club_payload(club, current_user=None):
    members_count = getattr(club, "members_count", None)
    if members_count is None:
        members_count = club.members.count()

    is_member = False
    if current_user and current_user.is_authenticated:
        is_member = club.members.filter(pk=current_user.pk).exists()

    return {
        "id": str(club.id),
        "name": club.name,
        "description": club.description,
        "authorId": str(club.author_id),
        "authorName": club.author.get_full_name().strip() or club.author.get_username(),
        "membersCount": members_count,
        "isMember": is_member,
        "createdAt": club.created_at.isoformat(),
    }


def _club_detail_payload(club, current_user=None):
    base = _club_payload(club, current_user=current_user)
    members = club.members.all().order_by("username")
    base["members"] = [_user_short_payload(member) for member in members]
    return base


def _diary_entry_payload(entry):
    return {
        "id": str(entry.id),
        "plantId": str(entry.plant_id),
        "authorId": str(entry.author_id),
        "date": entry.entry_date.isoformat(),
        "text": entry.text,
        "imageUrl": entry.image_url or None,
        "createdAt": entry.created_at.isoformat(),
    }


def _diary_plant_payload(plant, include_entries=False):
    entries = list(plant.entries.all().order_by("-entry_date", "-created_at"))
    latest_entry = entries[0] if entries else None

    payload = {
        "id": str(plant.id),
        "userId": str(plant.user_id),
        "name": plant.name,
        "description": plant.description,
        "entriesCount": len(entries),
        "createdAt": plant.created_at.isoformat(),
        "updatedAt": plant.updated_at.isoformat(),
        "latestEntry": _diary_entry_payload(latest_entry) if latest_entry else None,
    }

    if include_entries:
        payload["entries"] = [_diary_entry_payload(entry) for entry in entries]

    return payload


def _map_point_payload(point):
    point_type_map = {
        MapPoint.TYPE_EXCHANGE: "Точка обмена",
        MapPoint.TYPE_GARDEN: "Городской сад",
    }

    return {
        "id": str(point.id),
        "title": point.title,
        "description": point.description,
        "lat": point.lat,
        "lng": point.lng,
        "type": point_type_map.get(point.point_type, "Городской сад"),
        "authorId": str(point.author_id),
        "authorName": point.author.get_full_name().strip() or point.author.get_username(),
        "createdAt": point.created_at.isoformat(),
    }


def _recalculate_user_rating(user):
    avg_rating = user.received_trade_reviews.aggregate(avg=Avg("rating"))["avg"]
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.rate = Decimal(str(avg_rating or 0)).quantize(Decimal("0.01"))
    profile.save(update_fields=["rate"])


def _article_payload(article):
    tags = article.tags if isinstance(article.tags, list) else []
    author_name = (article.author_name or "").strip()

    if not author_name and article.author:
        author_name = article.author.get_full_name().strip() or article.author.get_username()

    if not author_name:
        author_name = "Гость"

    return {
        "id": article.slug,
        "title": article.title,
        "excerpt": article.excerpt,
        "content": article.content,
        "authorId": str(article.author_id) if article.author_id else None,
        "authorName": author_name,
        "createdAt": article.created_at.isoformat(),
        "imageUrl": article.image_url or None,
        "tags": tags,
    }


def _generate_article_slug(title):
    base = slugify(title)[:200] or f"article-{timezone.now().strftime('%Y%m%d%H%M%S')}"
    slug = base
    index = 2

    while Article.objects.filter(slug=slug).exists():
        suffix = f"-{index}"
        slug = f"{base[:220 - len(suffix)]}{suffix}"
        index += 1

    return slug


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def ping(request):
    return Response({"status": "ok"})


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def auth_register(request):
    User = get_user_model()

    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    username = (request.data.get("username") or request.data.get("name") or "").strip()

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(email__iexact=email).exists():
        return Response(
            {"detail": "User with this email already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not username:
        username = email.split("@")[0]

    user = User.objects.create_user( 
        username=username,
        email=email,
        password=password,
    )

    django_login(request, user)
    return Response(
        {
            "token": _session_token(request),
            "user": _user_payload(user),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def auth_login(request):
    User = get_user_model()

    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""

    if not email or not password:
        return Response(
            {"detail": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user_by_email = User.objects.filter(email__iexact=email).first()
    if not user_by_email:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    user = authenticate(request, username=user_by_email.get_username(), password=password)
    if not user:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    django_login(request, user)
    return Response(
        {
            "token": _session_token(request),
            "user": _user_payload(user),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def auth_logout(request):
    django_logout(request)
    return Response({"detail": "Logged out."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def auth_user(request):
    return Response(_user_payload(request.user))


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def profile_public(request, pk):
    User = get_user_model()
    user = get_object_or_404(User, pk=pk)
    return Response(_user_payload(user))


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
def profile_me_update(request):
    user = request.user
    if not user.is_authenticated:
        user = _bearer_session_user(request)
        if not user:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

    email = request.data.get("email")
    username = request.data.get("username")

    if email is not None:
        email = str(email).strip().lower()
        if not email:
            return Response({"detail": "Email cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            return Response({"detail": "User with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        user.email = email

    if username is not None:
        username = str(username).strip()
        if not username:
            return Response({"detail": "Username cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        user.username = username

    if email is not None or username is not None:
        user.save()

    return Response(_user_payload(user))


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def profile_reviews(request, pk):
    User = get_user_model()
    user = get_object_or_404(User, pk=pk)
    reviews = TradeReview.objects.filter(target=user).select_related("author", "target").order_by("-created_at")
    return Response([_trade_review_payload(review) for review in reviews])


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def articles_list(request):
    if request.method == "GET":
        articles = Article.objects.filter(is_published=True).select_related("author")
        return Response([_article_payload(article) for article in articles])

    title = str(request.data.get("title") or "").strip()
    content = str(request.data.get("content") or "").strip()
    excerpt = str(request.data.get("excerpt") or "").strip()
    image_url = str(request.data.get("imageUrl") or request.data.get("image_url") or "").strip()
    raw_tags = request.data.get("tags")
    requested_author_name = str(request.data.get("authorName") or "").strip()

    if not title:
        return Response({"detail": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)

    if not content:
        return Response({"detail": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)

    tags = []
    if isinstance(raw_tags, list):
        tags = [str(tag).strip() for tag in raw_tags if str(tag).strip()]
    elif isinstance(raw_tags, str):
        tags = [tag.strip() for tag in raw_tags.split(",") if tag.strip()]

    current_user = _resolve_request_user(request)
    author = current_user if current_user and current_user.is_authenticated else None

    if author:
        author_name = author.get_full_name().strip() or author.get_username()
    else:
        author_name = requested_author_name or "Гость"

    article = Article.objects.create(
        title=title,
        slug=_generate_article_slug(title),
        excerpt=excerpt or content[:220],
        content=content,
        author=author,
        author_name=author_name,
        tags=tags,
        image_url=image_url,
        is_published=True,
    )

    return Response(_article_payload(article), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def article_detail(request, slug):
    article = get_object_or_404(
        Article.objects.select_related("author").filter(is_published=True),
        slug=slug,
    )

    return Response(_article_payload(article))


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def calendar_list(request):
    return Response(_stub("calendar_list", results=[]))


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def categories_list(request):
    return Response(_stub("categories_list", results=[]))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def clubs_list(request):
    current_user = _resolve_request_user(request)

    if request.method == "GET":
        query = (request.query_params.get("q") or "").strip()
        clubs = Club.objects.select_related("author").annotate(members_count=Count("members", distinct=True))
        if query:
            clubs = clubs.filter(Q(name__icontains=query) | Q(description__icontains=query))
        return Response([_club_payload(club, current_user=current_user) for club in clubs])

    if not current_user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    name = (request.data.get("name") or request.data.get("title") or "").strip()
    description = (request.data.get("description") or "").strip()
    if not name:
        return Response({"detail": "Club name is required."}, status=status.HTTP_400_BAD_REQUEST)

    club = Club.objects.create(
        name=name,
        description=description,
        author=current_user,
    )
    club.members.add(current_user)
    club = Club.objects.select_related("author").annotate(members_count=Count("members", distinct=True)).get(pk=club.pk)
    return Response(_club_payload(club, current_user=current_user), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def club_detail(request, pk):
    current_user = _resolve_request_user(request)
    club = get_object_or_404(Club.objects.select_related("author").prefetch_related("members"), pk=pk)
    return Response(_club_detail_payload(club, current_user=current_user))


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def club_join(request, pk):
    current_user = _resolve_request_user(request)
    if not current_user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    club = get_object_or_404(Club.objects.select_related("author").prefetch_related("members"), pk=pk)
    club.members.add(current_user)
    club = Club.objects.select_related("author").prefetch_related("members").get(pk=club.pk)
    return Response(_club_detail_payload(club, current_user=current_user))


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def club_leave(request, pk):
    current_user = _resolve_request_user(request)
    if not current_user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    club = get_object_or_404(Club.objects.select_related("author").prefetch_related("members"), pk=pk)
    club.members.remove(current_user)
    club = Club.objects.select_related("author").prefetch_related("members").get(pk=club.pk)
    return Response(_club_detail_payload(club, current_user=current_user))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def topics_list(request):
    current_user = _resolve_request_user(request)

    if request.method == "GET":
        query = (request.query_params.get("q") or "").strip()
        topics = ForumTopic.objects.select_related("author").annotate(replies_count=Count("posts"))
        if query:
            topics = topics.filter(Q(title__icontains=query) | Q(description__icontains=query))

        subscribed_topic_ids = None
        if current_user:
            subscribed_topic_ids = set(
                ForumTopicSubscription.objects.filter(user=current_user).values_list("topic_id", flat=True)
            )

        return Response(
            [
                _forum_topic_payload(
                    topic,
                    current_user=current_user,
                    subscribed_topic_ids=subscribed_topic_ids,
                )
                for topic in topics
            ]
        )

    user = current_user
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    title = (request.data.get("title") or "").strip()
    description = (request.data.get("description") or "").strip()
    if not title or not description:
        return Response(
            {"detail": "Title and description are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    topic = ForumTopic.objects.create(
        title=title,
        description=description,
        author=user,
    )
    topic = ForumTopic.objects.select_related("author").get(pk=topic.pk)

    return Response(_forum_topic_payload(topic), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@renderer_classes([JSONRenderer])
def topic_detail(request, pk):
    current_user = _resolve_request_user(request)
    topic = get_object_or_404(ForumTopic.objects.select_related("author"), pk=pk)

    if request.method == "GET":
        return Response(_forum_topic_payload(topic, current_user=current_user))

    user = current_user
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not (user.is_staff or user.id == topic.author_id):
        return Response({"detail": "You do not have permission to manage this topic."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        topic.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    title = request.data.get("title")
    description = request.data.get("description")
    is_closed = request.data.get("isClosed", request.data.get("is_closed"))

    if title is not None:
        title = str(title).strip()
        if not title:
            return Response({"detail": "Title cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        topic.title = title

    if description is not None:
        description = str(description).strip()
        if not description:
            return Response({"detail": "Description cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        topic.description = description

    if is_closed is not None:
        topic.is_closed = bool(is_closed)

    topic.save()
    topic = ForumTopic.objects.select_related("author").annotate(replies_count=Count("posts")).get(pk=topic.pk)
    return Response(_forum_topic_payload(topic))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def topic_post_create(request, pk):
    topic = get_object_or_404(ForumTopic.objects.select_related("author"), pk=pk)

    if request.method == "GET":
        posts = ForumPost.objects.filter(topic=topic).select_related("author")
        return Response([_forum_post_payload(post) for post in posts])

    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if topic.is_closed and not user.is_staff and user.id != topic.author_id:
        return Response({"detail": "Topic is closed."}, status=status.HTTP_400_BAD_REQUEST)

    content = (request.data.get("content") or "").strip()
    if not content:
        return Response({"detail": "Content is required."}, status=status.HTTP_400_BAD_REQUEST)

    post = ForumPost.objects.create(topic=topic, author=user, content=content)

    subscribers = ForumTopicSubscription.objects.filter(topic=topic).exclude(user=user)
    notifications = [
        ForumTopicNotification(user=subscriber.user, topic=topic, post=post)
        for subscriber in subscribers.select_related("user")
    ]
    if notifications:
        ForumTopicNotification.objects.bulk_create(notifications, ignore_conflicts=True)

    post = ForumPost.objects.select_related("author").get(pk=post.pk)

    return Response(_forum_post_payload(post), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def topic_subscribe(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    topic = get_object_or_404(ForumTopic, pk=pk)
    ForumTopicSubscription.objects.get_or_create(user=user, topic=topic)
    return Response({"detail": "Subscribed."}, status=status.HTTP_200_OK)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def topic_unsubscribe(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    topic = get_object_or_404(ForumTopic, pk=pk)
    ForumTopicSubscription.objects.filter(user=user, topic=topic).delete()
    return Response({"detail": "Unsubscribed."}, status=status.HTTP_200_OK)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def forum_notifications(request):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    notifications = ForumTopicNotification.objects.filter(user=user).select_related("topic", "post")
    return Response([_forum_notification_payload(notification) for notification in notifications])


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def forum_notification_read(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    notification = get_object_or_404(ForumTopicNotification, pk=pk, user=user)
    if not notification.is_read:
        notification.is_read = True
        notification.save(update_fields=["is_read"])
    return Response(_forum_notification_payload(notification))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def listings(request):
    if request.method == "GET":
        query = (request.query_params.get("q") or "").strip()
        category = (request.query_params.get("category") or "").strip().lower()

        category_map = {
            "отдам даром": MarketplaceListing.CATEGORY_GIVEAWAY,
            "обмен": MarketplaceListing.CATEGORY_SWAP,
            "ищу": MarketplaceListing.CATEGORY_WANTED,
            "giveaway": MarketplaceListing.CATEGORY_GIVEAWAY,
            "swap": MarketplaceListing.CATEGORY_SWAP,
            "wanted": MarketplaceListing.CATEGORY_WANTED,
        }

        listings_qs = MarketplaceListing.objects.filter(is_active=True).select_related("author")
        if query:
            listings_qs = listings_qs.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if category in category_map:
            listings_qs = listings_qs.filter(category=category_map[category])

        return Response([_marketplace_payload(listing) for listing in listings_qs])

    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    title = (request.data.get("title") or "").strip()
    description = (request.data.get("description") or "").strip()
    category_label = (request.data.get("category") or "").strip().lower()
    location = (request.data.get("location") or "").strip()
    image_url = (request.data.get("imageUrl") or request.data.get("image_url") or "").strip()

    if not title or not description or not category_label:
        return Response(
            {"detail": "Title, description and category are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category_map = {
        "отдам даром": MarketplaceListing.CATEGORY_GIVEAWAY,
        "обмен": MarketplaceListing.CATEGORY_SWAP,
        "ищу": MarketplaceListing.CATEGORY_WANTED,
        "giveaway": MarketplaceListing.CATEGORY_GIVEAWAY,
        "swap": MarketplaceListing.CATEGORY_SWAP,
        "wanted": MarketplaceListing.CATEGORY_WANTED,
    }
    category_value = category_map.get(category_label)
    if not category_value:
        return Response({"detail": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)

    listing = MarketplaceListing.objects.create(
        title=title,
        description=description,
        category=category_value,
        author=user,
        location=location,
        image_url=image_url,
    )
    listing = MarketplaceListing.objects.select_related("author").get(pk=listing.pk)
    return Response(_marketplace_payload(listing), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
@renderer_classes([JSONRenderer])
def listing_detail(request, pk):
    listing = get_object_or_404(MarketplaceListing.objects.select_related("author"), pk=pk)

    if request.method == "GET":
        return Response(_marketplace_payload(listing))

    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    if not (user.is_staff or user.id == listing.author_id):
        return Response({"detail": "You do not have permission to manage this listing."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        listing.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    category_map = {
        "отдам даром": MarketplaceListing.CATEGORY_GIVEAWAY,
        "обмен": MarketplaceListing.CATEGORY_SWAP,
        "ищу": MarketplaceListing.CATEGORY_WANTED,
        "giveaway": MarketplaceListing.CATEGORY_GIVEAWAY,
        "swap": MarketplaceListing.CATEGORY_SWAP,
        "wanted": MarketplaceListing.CATEGORY_WANTED,
    }

    title = request.data.get("title")
    description = request.data.get("description")
    category_label = request.data.get("category")
    location = request.data.get("location")
    image_url = request.data.get("imageUrl", request.data.get("image_url"))
    is_active = request.data.get("isActive", request.data.get("is_active"))

    if title is not None:
        title = str(title).strip()
        if not title:
            return Response({"detail": "Title cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        listing.title = title

    if description is not None:
        description = str(description).strip()
        if not description:
            return Response({"detail": "Description cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        listing.description = description

    if category_label is not None:
        category_value = category_map.get(str(category_label).strip().lower())
        if not category_value:
            return Response({"detail": "Invalid category."}, status=status.HTTP_400_BAD_REQUEST)
        listing.category = category_value

    if location is not None:
        listing.location = str(location).strip()

    if image_url is not None:
        listing.image_url = str(image_url).strip()

    if is_active is not None:
        listing.is_active = bool(is_active)

    listing.save()
    listing = MarketplaceListing.objects.select_related("author").get(pk=listing.pk)
    return Response(_marketplace_payload(listing))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def exchanges_list(request):
    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == "GET":
        exchanges = TradeExchange.objects.filter(
            Q(initiator=user) | Q(counterparty=user)
        ).select_related("initiator", "counterparty")
        return Response([_trade_exchange_payload(exchange) for exchange in exchanges])

    counterparty_id = request.data.get("counterpartyId", request.data.get("counterparty_id"))
    items_from_initiator = (request.data.get("itemsFromInitiator") or request.data.get("items_from_initiator") or "").strip()
    items_from_counterparty = (request.data.get("itemsFromCounterparty") or request.data.get("items_from_counterparty") or "").strip()

    if not counterparty_id or not items_from_initiator or not items_from_counterparty:
        return Response(
            {"detail": "counterpartyId, itemsFromInitiator and itemsFromCounterparty are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    User = get_user_model()
    counterparty = User.objects.filter(pk=counterparty_id).first()
    if not counterparty:
        return Response({"detail": "Counterparty not found."}, status=status.HTTP_404_NOT_FOUND)

    if counterparty.id == user.id:
        return Response({"detail": "You cannot create exchange with yourself."}, status=status.HTTP_400_BAD_REQUEST)

    exchange = TradeExchange.objects.create(
        initiator=user,
        counterparty=counterparty,
        items_from_initiator=items_from_initiator,
        items_from_counterparty=items_from_counterparty,
    )
    exchange = TradeExchange.objects.select_related("initiator", "counterparty").get(pk=exchange.pk)
    return Response(_trade_exchange_payload(exchange), status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@renderer_classes([JSONRenderer])
def exchange_detail(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    exchange = get_object_or_404(TradeExchange.objects.select_related("initiator", "counterparty"), pk=pk)

    if not (user.is_staff or user.id in (exchange.initiator_id, exchange.counterparty_id)):
        return Response({"detail": "You do not have access to this exchange."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        return Response(_trade_exchange_payload(exchange))

    if request.method == "DELETE":
        if exchange.status == TradeExchange.STATUS_COMPLETED and not user.is_staff:
            return Response({"detail": "Completed exchange cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)
        exchange.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    if exchange.status == TradeExchange.STATUS_COMPLETED:
        return Response({"detail": "Completed exchange cannot be edited."}, status=status.HTTP_400_BAD_REQUEST)

    items_from_initiator = request.data.get("itemsFromInitiator", request.data.get("items_from_initiator"))
    items_from_counterparty = request.data.get("itemsFromCounterparty", request.data.get("items_from_counterparty"))
    status_value = request.data.get("status")

    if items_from_initiator is not None:
        items_from_initiator = str(items_from_initiator).strip()
        if not items_from_initiator:
            return Response({"detail": "itemsFromInitiator cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        exchange.items_from_initiator = items_from_initiator

    if items_from_counterparty is not None:
        items_from_counterparty = str(items_from_counterparty).strip()
        if not items_from_counterparty:
            return Response({"detail": "itemsFromCounterparty cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)
        exchange.items_from_counterparty = items_from_counterparty

    if status_value is not None and str(status_value) == TradeExchange.STATUS_CANCELLED:
        exchange.status = TradeExchange.STATUS_CANCELLED

    exchange.save()
    exchange = TradeExchange.objects.select_related("initiator", "counterparty").get(pk=exchange.pk)
    return Response(_trade_exchange_payload(exchange))


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def exchange_confirm(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    exchange = get_object_or_404(TradeExchange.objects.select_related("initiator", "counterparty"), pk=pk)
    if user.id not in (exchange.initiator_id, exchange.counterparty_id):
        return Response({"detail": "You do not have access to this exchange."}, status=status.HTTP_403_FORBIDDEN)

    if exchange.status == TradeExchange.STATUS_CANCELLED:
        return Response({"detail": "Cancelled exchange cannot be confirmed."}, status=status.HTTP_400_BAD_REQUEST)

    if user.id == exchange.initiator_id:
        exchange.confirmed_by_initiator = True
    if user.id == exchange.counterparty_id:
        exchange.confirmed_by_counterparty = True

    if exchange.confirmed_by_initiator and exchange.confirmed_by_counterparty:
        exchange.status = TradeExchange.STATUS_COMPLETED
        exchange.completed_at = timezone.now()

    exchange.save()
    exchange = TradeExchange.objects.select_related("initiator", "counterparty").get(pk=exchange.pk)
    return Response(_trade_exchange_payload(exchange))


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def exchange_reviews(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

    exchange = get_object_or_404(TradeExchange.objects.select_related("initiator", "counterparty"), pk=pk)
    if user.id not in (exchange.initiator_id, exchange.counterparty_id):
        return Response({"detail": "You do not have access to this exchange."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "GET":
        reviews = TradeReview.objects.filter(exchange=exchange).select_related("author", "target")
        return Response([_trade_review_payload(review) for review in reviews])

    if exchange.status != TradeExchange.STATUS_COMPLETED:
        return Response({"detail": "Reviews are available only for completed exchanges."}, status=status.HTTP_400_BAD_REQUEST)

    if TradeReview.objects.filter(exchange=exchange, author=user).exists():
        return Response({"detail": "You already left a review for this exchange."}, status=status.HTTP_400_BAD_REQUEST)

    target_id = request.data.get("targetId", request.data.get("target_id"))
    rating = request.data.get("rating")
    comment = (request.data.get("comment") or "").strip()

    if target_id is None or rating is None:
        return Response({"detail": "targetId and rating are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rating_value = int(rating)
    except (TypeError, ValueError):
        return Response({"detail": "rating must be integer from 1 to 5."}, status=status.HTTP_400_BAD_REQUEST)

    if rating_value < 1 or rating_value > 5:
        return Response({"detail": "rating must be integer from 1 to 5."}, status=status.HTTP_400_BAD_REQUEST)

    allowed_targets = {exchange.initiator_id, exchange.counterparty_id}
    try:
        target_id_int = int(target_id)
    except (TypeError, ValueError):
        return Response({"detail": "Invalid targetId."}, status=status.HTTP_400_BAD_REQUEST)

    if target_id_int not in allowed_targets or target_id_int == user.id:
        return Response({"detail": "You can review only the other participant."}, status=status.HTTP_400_BAD_REQUEST)

    User = get_user_model()
    target_user = get_object_or_404(User, pk=target_id_int)

    review = TradeReview.objects.create(
        exchange=exchange,
        author=user,
        target=target_user,
        rating=rating_value,
        comment=comment,
    )
    _recalculate_user_rating(target_user)

    review = TradeReview.objects.select_related("author", "target").get(pk=review.pk)
    return Response(_trade_review_payload(review), status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def diary_entries(request):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if request.method == "GET":
        plants = DiaryPlant.objects.filter(user=user).prefetch_related("entries")
        return Response([_diary_plant_payload(plant) for plant in plants])

    name = (request.data.get("name") or request.data.get("plantName") or "").strip()
    description = (request.data.get("description") or "").strip()
    if not name:
        return Response(
            {"detail": "Plant name is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    plant = DiaryPlant.objects.create(
        user=user,
        name=name,
        description=description,
    )
    plant = DiaryPlant.objects.prefetch_related("entries").get(pk=plant.pk)
    return Response(_diary_plant_payload(plant), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def diary_plant_detail(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    plant = get_object_or_404(DiaryPlant.objects.prefetch_related("entries"), pk=pk, user=user)
    return Response(_diary_plant_payload(plant, include_entries=True))


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def diary_plant_entry_create(request, pk):
    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    plant = get_object_or_404(DiaryPlant, pk=pk, user=user)

    text = (request.data.get("text") or request.data.get("description") or "").strip()
    image_url = (request.data.get("imageUrl") or request.data.get("image_url") or "").strip()
    raw_date = request.data.get("date")

    if not text:
        return Response(
            {"detail": "Entry text is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entry_date = timezone.localdate()
    if raw_date:
        try:
            entry_date = date.fromisoformat(str(raw_date))
        except ValueError:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    entry = DiaryEntry.objects.create(
        plant=plant,
        author=user,
        entry_date=entry_date,
        text=text,
        image_url=image_url,
    )

    DiaryPlant.objects.filter(pk=plant.pk).update(updated_at=timezone.now())
    entry = DiaryEntry.objects.get(pk=entry.pk)
    return Response(_diary_entry_payload(entry), status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@renderer_classes([JSONRenderer])
def map_points(request):
    if request.method == "GET":
        points = MapPoint.objects.select_related("author")
        return Response([_map_point_payload(point) for point in points])

    user = _resolve_request_user(request)
    if not user:
        return Response(
            {"detail": "Authentication credentials were not provided."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    title = (request.data.get("title") or "").strip()
    description = (request.data.get("description") or "").strip()
    point_type_value = request.data.get("type")
    point_type_raw = str(point_type_value).strip() if point_type_value is not None else ""
    lat_raw = request.data.get("lat")
    lng_raw = request.data.get("lng")

    if not title:
        return Response({"detail": "Title is required."}, status=status.HTTP_400_BAD_REQUEST)

    if lat_raw is None or lng_raw is None:
        return Response({"detail": "lat and lng are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lat = float(lat_raw)
        lng = float(lng_raw)
    except (TypeError, ValueError):
        return Response({"detail": "lat and lng must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

    if lat < -90 or lat > 90 or lng < -180 or lng > 180:
        return Response(
            {"detail": "Coordinates are out of range."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    type_alias_map = {
        "Точка обмена": MapPoint.TYPE_EXCHANGE,
        "Городской сад": MapPoint.TYPE_GARDEN,
        "exchange": MapPoint.TYPE_EXCHANGE,
        "garden": MapPoint.TYPE_GARDEN,
    }
    point_type = type_alias_map.get(point_type_raw, MapPoint.TYPE_GARDEN)

    point = MapPoint.objects.create(
        author=user,
        title=title,
        description=description,
        lat=lat,
        lng=lng,
        point_type=point_type,
    )
    point = MapPoint.objects.select_related("author").get(pk=point.pk)
    return Response(_map_point_payload(point), status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def users_list(request):
    User = get_user_model()
    users = User.objects.exclude(pk=request.user.id)
    
    return Response([_user_payload(user) for user in users])


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def dialogs_list(request):
    user = request.user
    
    # Get all users this user has messaged or been messaged by
    User = get_user_model()
    conversations = DirectMessage.objects.filter(
        Q(sender=user) | Q(recipient=user)
    ).select_related("sender", "recipient").order_by("-created_at")
    
    # Group by conversation partner
    dialogs = {}
    for msg in conversations:
        partner = msg.recipient if msg.sender_id == user.id else msg.sender
        if partner.id not in dialogs:
            dialogs[partner.id] = {
                "userId": str(partner.id),
                "userName": partner.get_full_name().strip() or partner.get_username(),
                "lastMessage": msg.content,
                "lastMessageAt": msg.created_at.isoformat(),
                "unreadCount": DirectMessage.objects.filter(
                    sender=partner,
                    recipient=user,
                    is_read=False
                ).count(),
            }
    
    return Response(list(dialogs.values()))


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def messages_with_user(request, user_id):
    user = request.user
    User = get_user_model()
    
    recipient = get_object_or_404(User, pk=user_id)
    
    if request.method == "GET":
        messages = DirectMessage.objects.filter(
            Q(sender=user, recipient=recipient) | Q(sender=recipient, recipient=user)
        ).select_related("sender", "recipient").order_by("created_at")
        
        # Mark messages as read
        DirectMessage.objects.filter(
            sender=recipient,
            recipient=user,
            is_read=False
        ).update(is_read=True)
        
        return Response([_direct_message_payload(msg) for msg in messages])
    
    # POST - send message
    content = (request.data.get("content") or "").strip()
    if not content:
        return Response(
            {"detail": "Content is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    message = DirectMessage.objects.create(
        sender=user,
        recipient=recipient,
        content=content,
    )
    message = DirectMessage.objects.select_related("sender", "recipient").get(pk=message.pk)
    
    return Response(_direct_message_payload(message), status=status.HTTP_201_CREATED)