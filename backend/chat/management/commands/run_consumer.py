import json
import asyncio
from django.core.management.base import BaseCommand
from chat.consumers import ChatConsumer
from chat.models import ChatSession as ChatSessionModel

class Command(BaseCommand):
    help = 'Runs the chat consumer'

    def handle(self, *args, **options):
        consumer = ChatConsumer()
        question = "How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?"
        
        sample_body = {
          "type": "generate_visualizations",
          "data": {
            "question": question,
            "session_id":str(ChatSessionModel.objects.last().session_id),
            "assistant_message_id": None
          }
        }
        
        sample_body = json.dumps(sample_body)
        asyncio.run(consumer.receive(sample_body))

        self.stdout.write(self.style.SUCCESS('Consumer tasks completed'))