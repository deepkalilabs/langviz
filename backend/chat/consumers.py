import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from llm_agents.helpers.dataset_enrich import DatasetEnrich, DatasetHelper
from llm_agents.helpers.question_viz import DatasetVisualizations
from chat.models import Dataset as DatasetModel, ChatSession as ChatSessionModel, Message as MessageModel
from accounts.models import User
from asgiref.sync import sync_to_async
from pprint import pprint
import uuid
from chat.serializers import ChatSessionSerializer
from dataclasses import dataclass

@dataclass
class DatasetInitiate:
    uri: str
    name: str
    description: str
    user: User
    
@dataclass
class VisualizationContext:
    questions: list
    session_id: uuid.UUID
    
class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enrich_dataset = None
        self.session_id = None
        self.dataset_viz_handler = None
        self.viz_types = None
        self.questions = None
        
    @sync_to_async
    def initiate_viz_handler(self, initiate_viz: VisualizationContext):
        
        if self.dataset_viz_handler is not None:
            return self.dataset_viz_handler
            
        dataset_chat_model = ChatSessionModel.objects.get(session_id=initiate_viz.session_id).main_dataset 
        
        self.enrich_dataset = DatasetHelper(dataset_chat_model.uri, enriched_columns_properties=dataset_chat_model.enriched_columns_properties, enriched_dataset_schema=dataset_chat_model.enriched_dataset_schema, save_to_db=False)
        
        if self.enrich_dataset is None:
            raise ValueError("Dataset not created")
    
        self.questions = initiate_viz.questions
        
        self.dataset_viz_handler = DatasetVisualizations(self.enrich_dataset, initiate_viz.questions)
        
        return self.dataset_viz_handler
        
    async def connect(self):
        print("connected to server")
        await self.accept()
        await self.send(
            text_data = json.dumps({"message": "connected to server"})
        )
        
    
    async def disconnect(self, close_code=None):
        print(f"Disconnected with code: {close_code}")
        pass
    
    def clean_code(self, code):
        return code.strip('`').replace('python', '').replace('\n', ' ').replace('\'', '"').strip()
    
    # TODO: create interface for receiving data
    async def receive(self, text_data: list):
        text_data = json.loads(text_data)
        text_data_json, message_type = text_data['data'], text_data['type']
        
        viz_context = VisualizationContext(questions=text_data_json['questions'], session_id=text_data_json['session_id'])
        
        await self.initiate_viz_handler(viz_context)
        
        if message_type == 'generate_visualizations':
            # Acknowledge the request
            if self.enrich_dataset == None:
                raise ValueError("Dataset not created")
                        
            await self.send(text_data=json.dumps({
                'role': 'assistant',
                'type': 'ack',
                'content': 'Generating visualization types',
                'chartData': None
            }))
            
            
            if self.dataset_viz_handler is None:
                raise ValueError("Dataset visualization handler not initialized")
        
            # Generate the visualization types
            visualization_objects = self.dataset_viz_handler.visualization_recommender_helper(question=viz_context.questions)

            self.viz_types = set([viz.visualization_type for viz in visualization_objects.visualizations])
            
            await self.send(text_data=json.dumps({
                'role': 'assistant',
                'type': 'viz_types',
                'content': "Generated visualization types: " + ", ".join(self.viz_types),
                'chartData': None
            }))
            
            # Generate the visualization code
            for viz in visualization_objects.visualizations:
                viz_dict = await self.dataset_viz_handler.generate_viz(self.enrich_dataset, viz)
                
                text_data=json.dumps({
                    'role': 'assistant',
                    'type': 'viz_code',
                    'content': f"{viz_dict['viz_name']} visualization generated",
                    'viz_name': viz_dict['viz_name'],
                    'pd_code': viz_dict['pd_code'],
                    'pd_viz_code': viz_dict['pd_viz_code'],
                    'svg_json': viz_dict['svg_json']
                })
                
                await self.send(text_data)
    

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
    sample_body = json.dumps({**{"questions": sample_body}, **{"type": "generate_visualizations"}})
    asyncio.run(consumer.receive(sample_body))
    
    # asyncio.run(consumer.receive({**text_data, **{type: "generate_visualizations"}}))
        
    

