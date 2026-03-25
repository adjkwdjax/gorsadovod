"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
import mimetypes

from django.contrib import admin
from django.conf import settings
from django.http import FileResponse, Http404
from django.urls import include, path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def serve_frontend(request, path=""):
    root = settings.FRONTEND_OUT_DIR
    if not root.exists():
        raise Http404("Frontend static build not found")

    safe_path = path.lstrip("/")
    candidates = []

    if safe_path:
        candidates.append(root / safe_path)
        candidates.append(root / safe_path / "index.html")
        if not safe_path.endswith(".html"):
            candidates.append(root / f"{safe_path}.html")
    else:
        candidates.append(root / "index.html")

    for candidate in candidates:
        try:
            resolved = candidate.resolve(strict=True)
        except FileNotFoundError:
            continue

        try:
            resolved.relative_to(root.resolve())
        except ValueError:
            continue
        if resolved.is_file():
            content_type, _ = mimetypes.guess_type(str(resolved))
            return FileResponse(open(resolved, "rb"), content_type=content_type)

    fallback = (root / "index.html").resolve(strict=True)
    try:
        fallback.relative_to(root.resolve())
    except ValueError as exc:
        raise Http404("Frontend static build path is invalid") from exc
    return FileResponse(open(fallback, "rb"), content_type="text/html")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    re_path(r"^(?P<path>.*)$", serve_frontend),
]
