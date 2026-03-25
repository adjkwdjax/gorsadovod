from django.contrib import admin
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
	MarketplaceListing,
	MapPoint,
	TradeExchange,
	TradeReview,
	UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
	list_display = ("user", "rate")
	search_fields = ("user__username", "user__email")


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
	list_display = ("title", "author", "is_published", "created_at")
	list_filter = ("is_published", "created_at")
	search_fields = ("title", "excerpt", "content", "author__username", "author__email")
	prepopulated_fields = {"slug": ("title",)}


@admin.register(ForumTopic)
class ForumTopicAdmin(admin.ModelAdmin):
	list_display = ("title", "author", "is_closed", "created_at")
	list_filter = ("is_closed", "created_at")
	search_fields = ("title", "description", "author__username", "author__email")


@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
	list_display = ("id", "topic", "author", "created_at")
	list_filter = ("created_at",)
	search_fields = ("content", "topic__title", "author__username", "author__email")


@admin.register(ForumTopicSubscription)
class ForumTopicSubscriptionAdmin(admin.ModelAdmin):
	list_display = ("topic", "user", "created_at")
	list_filter = ("created_at",)
	search_fields = ("topic__title", "user__username", "user__email")


@admin.register(ForumTopicNotification)
class ForumTopicNotificationAdmin(admin.ModelAdmin):
	list_display = ("user", "topic", "post", "is_read", "created_at")
	list_filter = ("is_read", "created_at")
	search_fields = ("topic__title", "post__content", "user__username", "user__email")


@admin.register(DirectMessage)
class DirectMessageAdmin(admin.ModelAdmin):
	list_display = ("sender", "recipient", "is_read", "created_at")
	list_filter = ("is_read", "created_at")
	search_fields = ("content", "sender__username", "sender__email", "recipient__username", "recipient__email")
	readonly_fields = ("created_at", "updated_at")


@admin.register(MarketplaceListing)
class MarketplaceListingAdmin(admin.ModelAdmin):
	list_display = ("title", "category", "author", "is_active", "created_at")
	list_filter = ("category", "is_active", "created_at")
	search_fields = ("title", "description", "author__username", "author__email", "location")
	readonly_fields = ("created_at", "updated_at")


@admin.register(TradeExchange)
class TradeExchangeAdmin(admin.ModelAdmin):
	list_display = (
		"id",
		"initiator",
		"counterparty",
		"status",
		"confirmed_by_initiator",
		"confirmed_by_counterparty",
		"created_at",
	)
	list_filter = ("status", "confirmed_by_initiator", "confirmed_by_counterparty", "created_at")
	search_fields = ("initiator__username", "counterparty__username", "items_from_initiator", "items_from_counterparty")
	readonly_fields = ("created_at", "updated_at", "completed_at")


@admin.register(TradeReview)
class TradeReviewAdmin(admin.ModelAdmin):
	list_display = ("exchange", "author", "target", "rating", "created_at")
	list_filter = ("rating", "created_at")
	search_fields = ("comment", "author__username", "target__username")
	readonly_fields = ("created_at", "updated_at")


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
	list_display = ("name", "author", "created_at")
	list_filter = ("created_at",)
	search_fields = ("name", "description", "author__username", "author__email")
	filter_horizontal = ("members",)
	readonly_fields = ("created_at", "updated_at")


@admin.register(DiaryPlant)
class DiaryPlantAdmin(admin.ModelAdmin):
	list_display = ("name", "user", "updated_at", "created_at")
	list_filter = ("updated_at", "created_at")
	search_fields = ("name", "description", "user__username", "user__email")
	readonly_fields = ("created_at", "updated_at")


@admin.register(DiaryEntry)
class DiaryEntryAdmin(admin.ModelAdmin):
	list_display = ("plant", "author", "entry_date", "created_at")
	list_filter = ("entry_date", "created_at")
	search_fields = ("text", "plant__name", "author__username", "author__email")
	readonly_fields = ("created_at", "updated_at")


@admin.register(MapPoint)
class MapPointAdmin(admin.ModelAdmin):
	list_display = ("title", "point_type", "author", "lat", "lng", "created_at")
	list_filter = ("point_type", "created_at")
	search_fields = ("title", "description", "author__username", "author__email")
	readonly_fields = ("created_at", "updated_at")
