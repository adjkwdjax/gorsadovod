from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Article


class ArticleApiTests(TestCase):
	def setUp(self):
		self.client = APIClient()

	def test_anonymous_user_can_create_article(self):
		payload = {
			"title": "Проверка статьи",
			"content": "Полный текст статьи",
			"authorName": "Иван Петров",
			"tags": ["город", "рассада"],
		}

		response = self.client.post("/api/articles/", payload, format="json")

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Article.objects.count(), 1)
		article = Article.objects.get()
		self.assertIsNone(article.author)
		self.assertEqual(article.author_name, "Иван Петров")
		self.assertEqual(response.data["authorName"], "Иван Петров")

	def test_authenticated_user_can_create_article(self):
		User = get_user_model()
		user = User.objects.create_user(
			username="garden_user",
			email="garden@example.com",
			password="password123",
			first_name="Сергей",
		)
		self.client.force_login(user)

		payload = {
			"title": "Статья от пользователя",
			"content": "Контент",
			"authorName": "Должно игнорироваться",
		}

		response = self.client.post("/api/articles/", payload, format="json")

		self.assertEqual(response.status_code, 201)
		article = Article.objects.get(slug=response.data["id"])
		self.assertEqual(article.author_id, user.id)
		self.assertEqual(article.author_name, "Сергей")
		self.assertEqual(response.data["authorName"], "Сергей")
