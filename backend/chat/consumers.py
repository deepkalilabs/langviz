import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

import json
import asyncio
from typing import Optional, List
from dataclasses import dataclass, asdict
import uuid

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.exceptions import ObjectDoesNotExist

# Assuming these imports are correct and the modules exist
from llm_agents.helpers.dataset_enrich import DatasetHelper
from llm_agents.helpers.question_viz import DatasetVisualizations
from chat.models import Dataset as DatasetModel, ChatSession as ChatSessionModel, UserMessage as UserMessageModel, AssistantMessage as AssistantMessageModel
from accounts.models import User as UserModel
from chat.serializers import ChatSessionSerializer

# Add the parent directory to sys.path

@dataclass
class DatasetInitiate:
    uri: str
    name: str
    description: str
    user: UserModel
    
@dataclass
class UserMessageBody:
    question: str
    session_id: uuid.UUID
    assistant_message_id: Optional[int] = None
    
@dataclass
class AssistantMessageBody:
    reason: str
    viz_name: str
    columns_involved: List[str]
    pd_code: str
    pd_viz_code: str
    svg_json: str
    
class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enrich_dataset = None
        self.session_id = None
        self.dataset_viz_handler = None
        self.viz_types = None
        self.questions = None
        self.chat_session = None
    async def connect(self):
        await self.accept()
        await self.send_json({"message": "Connected to server"})

    async def disconnect(self, close_code=None):
        print(f"Disconnected with code: {close_code}")
        
    async def send_ack(self, message: str):
        print("message", message)
        await self.send_json({
            'role': 'assistant',
            'type': 'ack',
            'content': message,
            'chartData': None
        })

    async def send_error(self, message: str):
        await self.send_json({
            'role': 'assistant',
            'type': 'error',
            'content': message
        })

    async def send_json(self, data: dict):
        await self.send(text_data=json.dumps(data))


    async def receive(self, text_data: str):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            message_body = data.get('data')

            if message_type == 'generate_visualizations':
                print(message_body, message_type)
                await self.handle_generate_visualizations(message_body)
            elif message_type == 'refine_visualization':
                await self.handle_refine_visualization(message_body)
            else:
                await self.send_error("Unknown message type")
        except json.JSONDecodeError:
            print("Invalid JSON")
            # self.send_error("Invalid JSON")
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            # self.send_error(f"An error occurred: {str(e)}")


    async def handle_generate_visualizations(self, message_body):
        print("message_body", message_body)
        user_message_body = UserMessageBody(**message_body)

        try:
            await self.initiate_viz_handler(user_message_body)
            user_message = await self.create_user_message(user_message_body)
            
            await self.send_ack("Generating visualization types")
            
            visualization_objects = self.generate_visualization_types(user_message_body.question)
            
            all_viz = set([viz.visualization_type for viz in visualization_objects.visualizations])
            print("all_viz", all_viz)

            await self.send_ack(f"Generated visualization types: {all_viz}")
            
            await self.generate_and_send_visualizations(visualization_objects)
        except ValueError as e:
            print(str(e))
            # await self.send_error(str(e))
            
    @sync_to_async
    def initiate_viz_handler(self, user_message: UserMessageBody):
        if self.dataset_viz_handler is not None:
            return

        try:
            self.chat_session = ChatSessionModel.objects.get(session_id=user_message.session_id)
                        
            dataset_chat_model = self.chat_session.main_dataset
            
            self.enrich_dataset = DatasetHelper(
                dataset_chat_model.uri,
                enriched_columns_properties=dataset_chat_model.enriched_columns_properties,
                enriched_dataset_schema=dataset_chat_model.enriched_dataset_schema,
                save_to_db=False
            )
            
            self.dataset_viz_handler = DatasetVisualizations(self.enrich_dataset, user_message.question)
            print("dataset_viz_handler", self.dataset_viz_handler)
            
            
        except ObjectDoesNotExist:
            raise ValueError("Chat session not found")
        except Exception as e:
            raise ValueError(f"Failed to initialize visualization handler: {str(e)}")

    @sync_to_async    
    def create_user_message(self, user_message_body: UserMessageBody):
        return UserMessageModel.objects.create(
            session=self.chat_session,
            question=user_message_body.question,
            reply_to_assistant_message=user_message_body.assistant_message_id,
            content=json.dumps(user_message_body.__dict__)
        )

    @sync_to_async
    def create_assistant_message(self, assistant_msg_body: AssistantMessageBody):
        return AssistantMessageModel.objects.create(
            session=self.chat_session,
            viz_name=assistant_msg_body.viz_name,
            pd_code=assistant_msg_body.pd_code,
            pd_viz_code=assistant_msg_body.pd_viz_code,
            svg_json=assistant_msg_body.svg_json,
            reason=assistant_msg_body.reason,
            columns_involved=assistant_msg_body.columns_involved
        )
        
    def generate_visualization_types(self, question: str):
        if self.dataset_viz_handler is None:
            raise ValueError("Dataset visualization handler not initialized")
        
        print("generating visualization types")
        
        return self.dataset_viz_handler.visualization_recommender_helper(question=question)
    

    async def generate_and_send_visualizations(self, visualization_objects):
        for viz in visualization_objects.visualizations:
            assistant_msg_body = await sync_to_async(self.dataset_viz_handler.generate_viz)(self.enrich_dataset, viz)
            
            assistant_msg_db = await self.create_assistant_message(assistant_msg_body)
            
            await self.send_json({
                'role': 'assistant',
                'type': 'viz_code',
                'assistant_message_id': assistant_msg_db.id,
                **asdict(assistant_msg_body)
            })

if __name__ == "__main__":
    text_data = {
        'uri': "https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv",
        'name': "cars",
        'description': "Car dataset"
    }
    consumer = ChatConsumer()
    
    sample_body = json.dumps({**text_data, **{"type": "create_dataset"}})
    asyncio.run(consumer.receive(sample_body))
    
    sample_body = ["How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?"]
    sample_body = json.dumps({**{"question": sample_body}, **{"type": "generate_visualizations"}})
    asyncio.run(consumer.receive(sample_body))
    
    # asyncio.run(consumer.receive({**text_data, **{type: "generate_visualizations"}}))
        
    

