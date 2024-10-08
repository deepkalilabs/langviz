from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'visualizations', views.VizualizationViewSet)
router.register(r'derived-datasets', views.DerivedDatasetViewSet)

urlpatterns = [
    path('', include(router.urls)),
]