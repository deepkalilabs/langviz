import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chat.models import AssistantMessage as AssistantMessageModel, UserMessage as UserMessageModel
import dspy
from llm_agents.helpers import utils 
# import utils
import json
import logging
from typing import Union
import pandas as pd
import warnings
from pprint import pprint
import os
from pydantic import BaseModel, Field
from typing import List
from dataclasses import dataclass
import time
import asyncio 
import concurrent.futures
from asgiref.sync import sync_to_async
import matplotlib.pyplot as plt
import mplcursors
import numpy as np
from chat.models import User as UserModel
import uuid
from typing import Optional

API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
N = 9
lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY, temperature=0.001*N)
dspy.settings.configure(lm=lm)

@dataclass
class Visualization(BaseModel):
    visualization_type: str
    columns_involved: List[str]
    reason: str

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
    assistant_message_id: Optional[str] = None
    
@dataclass
class AssistantMessageBody:
    reason: str
    viz_name: str
    columns_involved: List[str]
    pd_code: str
    pd_viz_code: str
    svg_json: str
    

class VisualizationRecommender(dspy.Signature):
    """
        Given the schema of the dataset and a question, return a list of 4 distinct well-thought visualization_types to help understand the question, the columns involved, and the reason for recommendation. Visualizations must be from the following list: [area_chart, line_chart, bar_chart, pie_chart, scatter_plot_chart, hexbin_chart]. The returned object should follow the Visualization class structure.
        
        class Visualization(BaseModel):
            visualization_type: str
            columns_involved: List[str]
            reason: str
    """
    schema = dspy.InputField(desc="The schema of the dataset.")
    question = dspy.InputField(desc="The question to be answered.")
    visualizations: list[Visualization] = dspy.OutputField(desc="List of dictionaries (List[Dict]) with visualizations, columns involved & reason for the visualization.")
    
class VisualizationRefiner(dspy.Signature):
    """
        A user wants to refine context from an existing conversation. 
        
        Given the schema of the dataset, the chat context, and a followup question, return a list of 1-2 distinct well-thought visualization_types to help respond to the question, the columns involved, and the reason for recommendation. Visualizations must be from the following list: [area_chart, line_chart, bar_chart, pie_chart, scatter_plot_chart, hexbin_chart]. The returned object should follow the Visualization class structure.
        
        class Visualization(BaseModel):
            visualization_type: str
            columns_involved: List[str]
            reason: str
    """
    schema = dspy.InputField(desc="The schema of the dataset.")
    question = dspy.InputField(desc="The question to be answered.")
    chat_context = dspy.InputField(desc="Context around the chat session.")
    visualizations: list[Visualization] = dspy.OutputField(desc="List of dictionaries (List[Dict]) with visualizations, columns involved & reason for the visualization.")
    
class PandasTransformationCode(dspy.Signature):
    """
        Given the schema of the master dataset, a type of visualization and its docs, and columns involved in the visualization, generate the pandas code to extract and tranform the data in dataframe df. Use the df variable from local namespace to extract the data. return the df in the fomrat that is compatible with the visualization docs. Do not change the column names.
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
    visualization_type = dspy.InputField(desc="Type of visualization to be generated")
    columns_involved = dspy.InputField(desc="Columns involved in the visualization to be generated")
    visualization_docs = dspy.InputField(desc="Pandas reference docs and code for the visualization for a different dataset")
    # prev_pd_code = dspy.InputField(desc="Previous pandas code to be used as reference.")
    # error_prev_pd_code = dspy.InputField(desc="Error in the previous pandas code.")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to extract, clean, and transform the data in dataframe df. The code should return the extracted data in a format compatible with pandas visualization code as shown in the visualization docs. Return variable name should be extract_df. Keep the column names as is.")
    
class PandasVisualizationCode(dspy.Signature):
    """
        Given a visualization type, details of columns involved in the visualization, and sample docs for pandas code to generate this visualization, return well-thought and clean pandas code to generate this visualization using best practices. Use the following local namespace: {'pd': pd, 'df': extracted_df, 'plt': plt, 'mplcursors': mplcursors, 'np': np, 'save_file_name': save_file_name}. Please follow the following instructions strictly:
        
        1. This visualization should be saved as an svg using the save_file_name.
        2. Use best practices to generate the visualization code for pandas.
        3. This visualization should be interactive.
        4. If the previous pandas code has an error, use the error_prev_pd_code and prev_pd_code to fix and rewrite the correct version of the pandas code.
        5. 'pd', 'df', 'plt', 'mplcursors', 'np', 'save_file_name' are in the local namespace.
        6. Save the generated visualization as an svg file in the save_file_name.
        7. Avoid deduplicating data.
    """
    visualization_type = dspy.InputField(desc="Type of visualization to be generated.")
    enriched_column_properties = dspy.InputField(desc="Details of the columns involved in the visualization. Use the column names from this to generate the visualization.")
    visualization_docs = dspy.InputField(desc="Pandas reference docs and code for the visualization for a different dataset.")
    prev_pd_code = dspy.InputField(desc="Previous pandas code to be used as reference.")
    error_prev_pd_code = dspy.InputField(desc="Error in the previous pandas code.")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to generate the visualization using the visualization docs as reference. Return variable name should be extract_viz.")
    

class DatasetVisualizations(dspy.Module):
    def __init__(self, dataset, question: str) -> None:
        self.main_dataset = dataset
        self.viz_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'example_charts_pd')

        self.visualization_recommender = dspy.ChainOfThought(VisualizationRecommender)
        self.pandas_code_generator = dspy.ChainOfThought(PandasTransformationCode)
        self.pandas_visualization_code_generator = dspy.ChainOfThought(PandasVisualizationCode)
        self.visualization_refiner = dspy.ChainOfThought(VisualizationRefiner)
        self.question = question
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)
        self.question_viz_details = {}
        
    
    def visualization_recommender_helper(self, user_message_body: UserMessageBody):
        try:
            print("about to recommend visualization")
            visualizations = self.visualization_recommender(schema=self.main_dataset.enriched_dataset_schema, question=user_message_body.question)
            return visualizations
        except Exception as e:
            print("Skipping visualization recommendation because of error: ", e)
            
    def visualization_refine_helper(self, user_message, assistant_message, last_x_questions):
        try:
            print("about to refine visualization")
            
            # TODO: Think if we need to do this for all messages in the chat session
            # TODO: Think if we need PD code here
            
            current_question = user_message.question
            prev_reason = assistant_message.reason
            prev_viz_name = assistant_message.viz_name
            prev_columns_involved = assistant_message.columns_involved

            last_x_questions = [question for question in last_x_questions if question != current_question]
            
            print("last_x_questions", last_x_questions)
                        
            prev_question = last_x_questions[-1] if len(last_x_questions) > 0 else current_question
            
            chat_context = f"""
                current question: {current_question}
                previous question: {prev_question}
                Previous reason: {prev_reason}
                Previous visualization name: {prev_viz_name}
                Previous columns involved: {prev_columns_involved}
            """
            
            if len(last_x_questions) > 0:
                chat_context = f"""
                    User's last questions: {last_x_questions}
                """ + chat_context 
            
            print("original_context", chat_context)
            print("schema", self.main_dataset.enriched_dataset_schema)
                        
            refined_visualizations = self.visualization_refiner(schema=self.main_dataset.enriched_dataset_schema, question=current_question, chat_context=chat_context)
            print("refined_visualizations", refined_visualizations)
            return refined_visualizations
        except Exception as e:
            print("Skipping visualization refinement because of error: ", e)
    
    
    def pandas_code_generator_helper(self, enriched_dataset_schema, visualization_type, columns_involved, viz_docs, prev_pd_code=None, error_prev_pd_code=None):
        try:
            pandas_code = self.pandas_code_generator(
                enriched_dataset_schema=enriched_dataset_schema, 
                visualization_type=visualization_type, 
                columns_involved=columns_involved, 
                visualization_docs=viz_docs
            )
            return pandas_code
        except Exception as e:
            print("Skipping pandas code generation because of error: ", e, visualization_type)
            
            
    def pandas_visualization_code_generator_helper(self, visualization_type, enriched_column_properties, visualization_docs, prev_pd_code, error_prev_pd_code):
        try:
            pandas_code = self.pandas_visualization_code_generator(
                visualization_type=visualization_type, 
                enriched_column_properties=enriched_column_properties, 
                visualization_docs=visualization_docs,
                prev_pd_code=prev_pd_code,
                error_prev_pd_code=error_prev_pd_code
            )
            return pandas_code
        except Exception as e:
            print("Skipping pandas visualization code generation because of error: ", e, visualization_type)
    
    
    def clean_code(self, code):
        return code.strip('`').replace('python', '').strip()

    
    def execute_pandas_code(self, pandas_code, local_namespace, return_var_name):        
        cleaned_code = self.clean_code(pandas_code)

        exec(cleaned_code, globals(), local_namespace)
        
        print("local_namespace", local_namespace)
        
        return local_namespace.get(return_var_name)
    
        
    def get_enriched_extracted_columns(self, extracted_df):
        extracted_df_set = set(extracted_df.columns.to_list())
        enriched_extracted_columns = []
        for column_details in self.main_dataset.enriched_column_properties:
            if column_details.get('column_name', '') in extracted_df_set:
                enriched_extracted_columns.append(column_details)
        return enriched_extracted_columns
    
    
    def generate_viz(self, visualization) -> AssistantMessageBody:
        
        if os.path.exists(os.path.join(self.viz_dir, f"{visualization.visualization_type}.py")):
            viz_docs = open(os.path.join(self.viz_dir, f"{visualization.visualization_type}.py")).read()            
        elif os.path.exists(os.path.join(self.viz_dir, f"{visualization.visualization_type}_chart.py")):
            viz_docs = open(os.path.join(self.viz_dir, f"{visualization.visualization_type}_chart.py")).read()
        else:
            raise ValueError(f"No visualization docs found for {visualization.visualization_type}")
        
        pd_code = self.pandas_code_generator_helper(
            self.main_dataset.enriched_dataset_schema, 
            visualization.visualization_type,
            visualization.columns_involved,
            viz_docs
        )
        print("pd_code", pd_code)
        
        print("self.main_dataset.df", self.main_dataset)
        local_namespace = {'pd': pd, 'df': self.main_dataset.df, 'plt': plt}
        extracted_df = self.execute_pandas_code(pd_code.pandas_code, local_namespace, 'extract_df')
        print("extracted_df_list", extracted_df)
            
        enriched_extracted_columns = self.get_enriched_extracted_columns(extracted_df)
        print("enriched_extracted_columns", enriched_extracted_columns)
        # pd_viz_code = await asyncio.get_event_loop().run_in_executor(
        #     self.executor,

        enriched_extracted_columns = self.get_enriched_extracted_columns(extracted_df)
        print("enriched_extracted_columns", enriched_extracted_columns)
        # pd_viz_code = await asyncio.get_event_loop().run_in_executor(
        #     self.executor,
        
        try_count = 0
        prev_pd_code = None
        error_prev_pd_code = None
        save_file_name = f"{visualization.visualization_type}_test.svg"
        while try_count < 5:
            try:
                enriched_extracted_columns = self.get_enriched_extracted_columns(extracted_df)
                print("enriched_extracted_columns", enriched_extracted_columns)
                pd_viz_code = self.pandas_visualization_code_generator_helper(
                    visualization.visualization_type,
                    enriched_extracted_columns,
                    viz_docs, 
                    prev_pd_code,
                    error_prev_pd_code
                )
                
                print(self.clean_code(pd_viz_code.pandas_code))
    
                local_namespace = {'pd': pd, 'df': extracted_df, 'plt': plt, 'mplcursors': mplcursors, 'np': np, 'save_file_name': save_file_name}
                
                print("debugging pd_viz_code", self.clean_code(pd_viz_code.pandas_code))
                
                extracted_viz = self.execute_pandas_code(pd_viz_code.pandas_code, local_namespace, 'extract_viz')
                
                with open(save_file_name, "r") as f:
                    svg_content = f.read()
                
                svg_json = json.dumps({'svg': svg_content})
                
                print("extracted_viz", extracted_viz)
                
                assistant_message_body = AssistantMessageBody(
                    reason=visualization.reason,
                    viz_name=visualization.visualization_type,
                    columns_involved=visualization.columns_involved,
                    pd_code=pd_code.pandas_code,
                    pd_viz_code=pd_viz_code.pandas_code,
                    svg_json=svg_json
                )
                
                return assistant_message_body
                
            except Exception as e:
                try_count += 1
                print("Skipping pandas visualization code execution because of error: ", e, visualization)
                prev_pd_code = pd_viz_code.pandas_code
                error_prev_pd_code = e
                
    async def process_all_visualizations(self, question):
        viz = self.visualization_recommender_helper(question)
        
        for visualization in viz.visualizations:
            result = await self.generate_viz(self.main_dataset.enriched_dataset_schema, visualization)
            print(result)
            # yield result
            
    def forward(self):
        start_time = time.time()
        if len(self.question) > 1:
            raise ValueError("More than one questions provided")
        
        results = []
        
        # asyncio.run(self.process_all_visualizations(self.question))
        
        results = [result for result in self.process_all_visualizations(self.questions[0])]
        
        end_time = time.time()
        print(f"Time taken: {end_time - start_time:.2f} seconds") 
        return results
    
if __name__ == "__main__":
    csv_file_uri = "https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv"
    question = "How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?"
    
    """
            "How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?",
            # "What is the distribution of retail prices across different vehicle types, and how does it compare to dealer costs?",
            # "How does the horsepower-to-weight ratio vary among different vehicle types, and is there a correlation with retail price?",
            # "What is the relationship between a vehicle's physical dimensions (length, width, wheelbase) and its fuel efficiency?"
    """