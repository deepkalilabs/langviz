import json
import asyncio
from django.core.management.base import BaseCommand
from chat.consumers import ChatConsumer
from chat.models import ChatSession as ChatSessionModel, AssistantMessage as AssistantMessageModel

class Command(BaseCommand):
    help = 'Runs the chat consumer'

    def handle(self, *args, **options):
        consumer = ChatConsumer()
        chat_session = ChatSessionModel.objects.last()
        print("chat_session", chat_session)
        sample_body = {
          "type": "generate_visualizations",
          "user_message_body": {
            "question": "How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?",
            "session_id": str(chat_session.session_id),
          },
           "reply_to_assistant_message_uuid": None
        }
        
        # sample_body = json.dumps(sample_body)
        # asyncio.run(consumer.receive(sample_body))
        
        sample_body = {
          "type": "refine_visualizations",
          "user_message_body": {
            "question": "Can you add a visualization for the relationship between engine size and fuel efficiency for both city and highway across different vehicle types?",
            "session_id": str(chat_session.session_id),
          },
          "reply_to_assistant_message_uuid": str(AssistantMessageModel.objects.last().uuid)
        }
        
        # sample_body = json.dumps(sample_body)
        # print("sample_body", sample_body)
        # asyncio.run(consumer.receive(sample_body))
        
        sample_body = {
          "type": "analyze_visualization",
          "user_message_body": {
            "question": "",
            "session_id": str(chat_session.session_id),
          },
          "reply_to_assistant_message_uuid": str(AssistantMessageModel.objects.last().uuid)
        }
        
        sample_body = json.dumps(sample_body)
        print("sample_body", sample_body)
        asyncio.run(consumer.receive(sample_body))


        self.stdout.write(self.style.SUCCESS('Consumer tasks completed'))