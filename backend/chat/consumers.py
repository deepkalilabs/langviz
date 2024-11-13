import os
import sys
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
class ServerMessage:
    user_message_body: dict
    type: str
    reply_to_assistant_message_uuid: Optional[str] = None

@dataclass
class DatasetInitiate:
    s3Uri: str
    name: str
    description: str
    user: UserModel
    
@dataclass
class UserMessageBody:
    question: str
    session_id: uuid.UUID
    
@dataclass
class AssistantMessageBody:
    reason: str
    viz_name: str
    columns_involved: List[str]
    pd_code: str
    pd_viz_code: str
    svg_json: str
    data: List[dict]
    extra_attrs: dict
    
class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enrich_dataset = None
        self.session_id = None
        self.dataset_viz_handler = None
        self.viz_types = None
        self.questions = None
        self.chat_session = None
        self.active_user_message = None
        
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
        # print("data", data)
        # return
        await self.send(text_data=json.dumps(data))


    async def receive(self, text_data: str):
        # try:
        data = ServerMessage(**json.loads(text_data))
        message_body = UserMessageBody(**data.user_message_body)
        self.chat_session = await self.get_chat_session(message_body.session_id)
        
        self.active_user_message = await self.create_user_message(message_body)

        if data.type == 'generate_visualizations':
            print(message_body, data.type)
            await self.handle_generate_visualizations(message_body)
        elif data.type == 'refine_visualizations':
            await self.handle_refine_visualization(message_body, data.reply_to_assistant_message_uuid)
        elif data.type == 'analyze_visualization':
            await self.handle_analyze_visualization(message_body, data.reply_to_assistant_message_uuid)
        # else:
        #     await self.send_error("Unknown message type")
        # except json.JSONDecodeError:
        #     print("Invalid JSON")
        #     await self.send_error("Invalid JSON")
        # except Exception as e:
        #     print(f"An error occurred: {str(e)}")
        #     await self.send_error(f"An error occurred: {str(e)}")


    async def handle_refine_visualization(self, message_body: UserMessageBody, reply_to_assistant_message_uuid: str):
        try:
            await self.send_ack("Refining visualization...")

            await self.initialize_dataset_viz_handler(message_body)
                        
            if self.dataset_viz_handler is None:
                raise ValueError("Dataset visualization handler not initialized")
            
            assistant_message = await self.get_assistant_message(reply_to_assistant_message_uuid)
            
            last_5_questions = await self.get_last_x_questions(1000)
            
            visualization_objects = self.dataset_viz_handler.visualization_refine_helper(user_message=message_body, assistant_message=assistant_message, last_x_questions=last_5_questions)
            
            print("visualization_objects", visualization_objects)

            all_viz = set([viz.visualization_type for viz in visualization_objects])
            print("all_viz", all_viz)

            await self.send_ack(f"Refined visualization types: {all_viz}")
            
            await self.generate_and_send_visualizations(visualization_objects)
        except ValueError as e:
            print(str(e))
            # await self.send_error(str(e))
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            # await self.send_error(f"An error occurred: {str(e)}")
            
    async def handle_analyze_visualization(self, message_body: UserMessageBody, reply_to_assistant_message_uuid: str):
        print("message_body", message_body)
        try: 
            await self.send_ack("Analyzing visualization...")
            await self.initialize_dataset_viz_handler(message_body)
            
            # TODO: Add analysis to the assistant message.
            assistant_message_db = await self.get_assistant_message(reply_to_assistant_message_uuid)
                        
            analysis = self.dataset_viz_handler.analyze_visualization(assistant_message_db)
            
            assistant_message = AssistantMessageBody(
                reason=analysis,
                viz_name=assistant_message_db.viz_name,
                columns_involved=assistant_message_db.columns_involved,
                pd_code=assistant_message_db.pd_code,
                pd_viz_code=assistant_message_db.pd_viz_code,
                svg_json=assistant_message_db.svg_json,
                data=[],
                extra_attrs=assistant_message_db.extra_attrs
            )
            
            print("analysis", analysis)
            
            visualization_response = {
                'role': 'assistant',
                'type': 'analyze_visualization',
                # Using UUIDs to avoid message collisions in DB/FE.
                'assistant_message_uuid': str(assistant_message_db.uuid),
                **asdict(assistant_message),
            }
                
            await self.send_json(visualization_response)
        except ValueError as e:
            print(str(e))
            # await self.send_error(str(e))
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            # await self.send_error(f"An error occurred: {str(e)}")
            
    async def handle_generate_visualizations(self, message_body: UserMessageBody):
        print("message_body", message_body)

        try:
            await self.send_ack("Generating visualization types...")

            await self.initialize_dataset_viz_handler(message_body)
                        
            if self.dataset_viz_handler is None:
                raise ValueError("Dataset visualization handler not initialized")
            
            visualization_objects = self.dataset_viz_handler.visualization_recommender_helper(user_message_body=message_body)
            
            all_viz = [viz.visualization_type for viz in visualization_objects]
            print("all_viz", all_viz)

            await self.send_ack(f"Generated visualization types: {all_viz}")
            
            await self.generate_and_send_visualizations(visualization_objects)
        except ValueError as e:
            print(str(e))
            await self.send_error(str(e))
            
    @sync_to_async
    def get_chat_session(self, session_id: uuid.UUID):
        self.chat_session = ChatSessionModel.objects.get(session_id=session_id)
        return self.chat_session
    
    @sync_to_async
    def initialize_dataset_viz_handler(self, user_message: UserMessageBody):
        if self.dataset_viz_handler is not None:
            return self.dataset_viz_handler
        
        try:
            dataset_chat_model = self.chat_session.main_dataset
            
            self.enrich_dataset = DatasetHelper(
                dataset_chat_model.s3Uri,
                enriched_columns_properties=dataset_chat_model.enriched_columns_properties,
                enriched_dataset_schema=dataset_chat_model.enriched_dataset_schema,
                save_to_db=False
            )
            
            self.dataset_viz_handler = DatasetVisualizations(self.enrich_dataset, user_message.question)
            print("dataset_viz_handler", self.dataset_viz_handler)
            
            return self.dataset_viz_handler
            
        except ObjectDoesNotExist:
            raise ValueError("Chat session not found")
        except Exception as e:
            raise ValueError(f"Failed to initialize visualization handler: {str(e)}")

    @sync_to_async    
    def create_user_message(self, user_message_body: UserMessageBody):
        
        user_message = UserMessageModel.objects.create(
            session=self.chat_session,
            question=user_message_body.question,
            # Might wanna add more details here.
            content=json.dumps(user_message_body.__dict__)
        )
        print("user_message", user_message)
        return user_message
    
    @sync_to_async
    def get_assistant_message(self, reply_to_assistant_message_uuid: str):
        assistant_message_db = AssistantMessageModel.objects.get(uuid=reply_to_assistant_message_uuid)
        
        return assistant_message_db
    
    @sync_to_async
    def get_last_x_questions(self, x: int):
        user_messages = UserMessageModel.objects.filter(session=self.chat_session).order_by('-id')[:x]
        return list(user_messages.values_list('question', flat=True))
    
    @sync_to_async
    def create_assistant_message(self, assistant_msg_body: AssistantMessageBody):
        assistant_message = AssistantMessageModel.objects.create(
            session=self.chat_session,
            viz_name=assistant_msg_body.viz_name,
            pd_code=assistant_msg_body.pd_code,
            pd_viz_code=assistant_msg_body.pd_viz_code,
            svg_json=assistant_msg_body.svg_json,
            reason=assistant_msg_body.reason,
            columns_involved=assistant_msg_body.columns_involved,
            extra_attrs=assistant_msg_body.extra_attrs,
            parent_user_message_id=self.active_user_message.id
        )
        
        print(assistant_message)
        return assistant_message
    
    async def generate_and_send_visualizations(self, visualization_objects):
        if self.dataset_viz_handler is None:
            raise ValueError("Dataset visualization handler not initialized")
        
        for viz in visualization_objects:
            try:
                assistant_msg_body: AssistantMessageBody = await sync_to_async(self.dataset_viz_handler.generate_viz)(viz)
                
                assistant_msg_db = await self.create_assistant_message(assistant_msg_body)
                
                visualization_response = {
                    'role': 'assistant',
                    'type': 'viz_code',
                    # Using UUIDs to avoid message collisions in DB/FE.
                    'assistant_message_uuid': str(assistant_msg_db.uuid),
                    **asdict(assistant_msg_body)
                }
                
                await self.send_json(visualization_response)
            except Exception as e:
                print(f"An error occurred: {str(e)}")
                continue

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
        
    

