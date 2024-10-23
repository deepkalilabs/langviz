from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Dataset as DatasetModel, ChatSession as ChatSessionModel, UserMessage as UserMessageModel, AssistantMessage as AssistantMessageModel
from accounts.models import User
from .serializers import DatasetSerializer, ChatSessionSerializer, UserMessageSerializer, AssistantMessageSerializer
import requests
import pandas as pd
from io import StringIO
from llm_agents.helpers.dataset_enrich import DatasetEnrich, DatasetHelper
from llm_agents.helpers.question_viz import DatasetVisualizations
from django.views.decorators.csrf import csrf_exempt
from django.http import Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
import uuid
from pprint import pprint


def create_dataset_helper(request):
    name = request.data.get('name', '')
    s3Uri = request.data.get('s3Uri', '')
    publicUrl = request.data.get('publicUrl', '')
    description = request.data.get('description', '')
    
    print(s3Uri, publicUrl)
    
    if not publicUrl:
        raise ValueError('publicUrl is required')
    
    try:
        # TODO: Change to s3Uri
        enrich_schema = DatasetEnrich(s3Uri).forward()
        
        dataset = DatasetModel.objects.create(name=name, s3Uri=s3Uri, publicUrl=publicUrl, description=description, enriched_columns_properties=enrich_schema['enriched_column_properties'], enriched_dataset_schema=enrich_schema['enriched_dataset_schema'])
        
        # dataset = DatasetModel.objects.last()
        
        print("dataset", dataset)
        
        return dataset
    except Exception as e:
        raise ValueError(f'Failed to create dataset: {str(e)}')


@method_decorator(csrf_exempt, name='dispatch')
class ChatSession(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, format=None):
        try:
            dataset = create_dataset_helper(request)
        except Exception as e:
            return Response({'error': f'Failed to create dataset: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        
        chat_session = ChatSessionModel.objects.create(
            user=User.objects.first(),
            session_id=uuid.uuid4(),
            main_dataset=dataset
        )
        
        serializer = ChatSessionSerializer(chat_session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

            
    def get(self, format=None):
        print(DatasetModel.objects.all())
        datasets = DatasetModel.objects.first()
        serializer = DatasetSerializer(datasets)
        return Response(serializer.data)