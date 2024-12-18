import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chat.models import AssistantMessage as AssistantMessageModel, UserMessage as UserMessageModel
import dspy
from llm_agents.helpers import utils 
import json
from typing import Union
import pandas as pd
from pprint import pprint
import os
from pydantic import BaseModel, Field
from typing import List
from dataclasses import dataclass
import time
import concurrent.futures
from asgiref.sync import sync_to_async
import matplotlib.pyplot as plt
import mplcursors
import numpy as np
from chat.models import User as UserModel
import uuid
from typing import Optional
from cairosvg import svg2png
import base64
from io import BytesIO

N = 9
openai_lm = dspy.LM('openai/gpt-4o-mini', api_key=os.environ.get('OPENAI_API_KEY'), temperature=0.001*N)
anthropic_lm = dspy.LM('anthropic/claude-3-5-sonnet-20240620', api_key=os.environ.get('ANTHROPIC_API_KEY'))
dspy.settings.configure(lm=anthropic_lm)

@dataclass
class Visualization(BaseModel):
    visualization_type: str
    columns_involved: List[str]
    reason: str

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
    assistant_message_id: Optional[str] = None
    
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
    
class QuestionRefiner(dspy.Signature):
    """
        Given the schema of the master dataset, the chat context, and a question, return a list of 2 refined questions (list[str]) that are more specific and informative. The refined question should lead to effective exploratory and descriptive data analysis and visualization. Only return a list of 2 questions (List[str]). Output begins with [ and ends with ].
        
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset.")
    question = dspy.InputField(desc="The question to be refined.")
    chat_context = dspy.InputField(desc="The chat context of the user & agent interactions previously.")
    questions: list[str] = dspy.OutputField(format=list, desc="List of 2 refined questions that are more specific and informative.")
    

class VisualizationRecommender(dspy.Signature):
    """
        Given the schema of the dataset and a question, return a list of 2 distinct well-thought visualization_types to help understand the question, the columns involved, and the reason for recommendation. Visualizations must be from the following list: [area_chart, line_chart, bar_chart, pie_chart, scatter_plot_chart, hexbin_chart]. The returned object should follow the Visualization class structure.
        
        class Visualization(BaseModel):
            visualization_type: str
            columns_involved: List[str]
            reason: str
    """
    schema = dspy.InputField(desc="The schema of the dataset.")
    question = dspy.InputField(desc="The question to be answered.")
    visualizations: list[Visualization] = dspy.OutputField(format=list, desc="List of dictionaries (List[Dict]) with visualizations, columns involved & reason for the visualization.")

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
        Given the schema of the master dataset, a type of visualization and its docs, and columns involved in the visualization, generate the pandas code to extract, clean, and transform the data in dataframe df using best practices. Follow the instructions strictly:
        
        1. Use the df variable from local namespace to extract the data. 
        2. Return the df in the fomrat that is compatible with the visualization docs. 
        3. Do not change the column names.
        4. 'pd', 'df', 'plt', 'np', 'save_file_name' are in the local namespace.
        5. Remove NaNs, Infs, Nulls, and other invalid values.
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
    visualization_type = dspy.InputField(desc="Type of visualization to be generated")
    columns_involved = dspy.InputField(desc="Columns involved in the visualization to be generated")
    visualization_docs = dspy.InputField(desc="Pandas reference docs and code for the visualization for a different dataset")
    template_code = dspy.InputField(desc="Template code to be filled in with the pandas code.")
    # prev_pd_code = dspy.InputField(desc="Previous pandas code to be used as reference.")
    # error_prev_pd_code = dspy.InputField(desc="Error in the previous pandas code.")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to extract, clean, and transform the data in dataframe df. The code should return the extracted data in a format compatible with pandas visualization code as shown in the visualization docs. Return variable name should be extract_df. Keep the column names as is.")
    
class PandasVisualizationCode(dspy.Signature):
    """
        Given a visualization type, details of columns involved in the visualization, and sample docs for pandas code to generate this visualization, return well-thought and clean pandas code to generate this visualization using best practices. Please follow the following instructions strictly:
        
        1. This visualization should be saved as an svg using the save_file_name.
        2. Use best practices to generate the visualization code for pandas. Always include labels and legends.
        3. If the previous pandas code has an error, use the error_prev_pd_code and prev_pd_code to fix and rewrite the correct version of the pandas code.
        4. If the solution requires a single value (e.g. max, min, median, first, last etc), ALWAYS add a line (axvline or axhline) to the chart, ALWAYS with a legend containing the single value (formatted with 0.2F).
        5. 'pd', 'df', 'plt', 'np', 'save_file_name' are in the local namespace.
        6. Save the generated visualization as an svg file in the save_file_name.
        7. Avoid deduplicating data or creating duplicate charts/axis.
        8. Charts should be of size 6x4.
    """
    visualization_type = dspy.InputField(desc="Type of visualization to be generated.")
    enriched_column_properties = dspy.InputField(desc="Details of the columns involved in the visualization. Use the column names from this to generate the visualization.")
    visualization_docs = dspy.InputField(desc="Pandas reference docs and code for the visualization for a different dataset.")
    template_code = dspy.InputField(desc="Template code to be filled in with the pandas code.")
    prev_pd_code = dspy.InputField(desc="Previous pandas code to be used as reference.")
    error_prev_pd_code = dspy.InputField(desc="Error in the previous pandas code.")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to generate the visualization using the visualization docs as reference. Return variable name should be extract_viz.")
    
class VisualizationAnalyzer():
    """
        Given a visualization PNG, the columns involved in the visualization, and the reason for the visualization, return a detailed analysis of the visualization.
    """
    # ... existing imports ...
from openai import OpenAI
import base64
from io import BytesIO

# Add after other class definitions
class VisualizationAnalyzer:
    """
    Given a visualization PNG, the columns involved in the visualization, and the reason for the visualization, 
    return a detailed analysis of the visualization.
    """
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
        
    def analyze(self, png_base64: str, enriched_column_properties: List[dict], reason: str) -> str:
        """
        Analyze a visualization using OpenAI's vision model.
        
        Args:
            png_base64: PNG base64 data
            columns_involved: List of column names used in visualization
            reason: Reason for creating this visualization
        
        Returns:
            str: Analysis of the visualization
        """
        try:
            if not png_base64:
                return "Error: No image data found"

            # Construct the prompt
            prompt = f"""You are an expert data analyst. Analyze this visualization:
            - Details of columns: {enriched_column_properties}
            - Purpose: {reason}
            
            Please provide:
            1. A clear description of what the visualization shows
            2. Key patterns or trends and potential reasons for them.
            3. Any notable outliers or interesting points
            """

            # Call OpenAI Vision API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{png_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500
            )
            
            return response.choices[0].message.content

        except Exception as e:
            return f"Error analyzing visualization: {str(e)}"
    

class DatasetVisualizations(dspy.Module):
    def __init__(self, dataset, question: str) -> None:
        self.main_dataset = dataset
        self.viz_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'example_charts_pd')

        self.question_refiner = dspy.ChainOfThought(QuestionRefiner)
        self.visualization_recommender = dspy.ChainOfThought(VisualizationRecommender)
        self.pandas_code_generator = dspy.ChainOfThought(PandasTransformationCode)
        self.pandas_visualization_code_generator = dspy.ChainOfThought(PandasVisualizationCode)
        self.visualization_refiner = dspy.ChainOfThought(VisualizationRefiner)
        self.question = question
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)
        self.question_viz_details = {}
        
    
    def visualization_recommender_helper(self, user_message_body: UserMessageBody):
        try:
            visualization_list = []
            print("about to recommend visualization")
            
            refined_questions = self.question_refiner(enriched_dataset_schema=self.main_dataset.enriched_dataset_schema, chat_context=user_message_body.question, question=user_message_body.question)
            
            for question in refined_questions.questions:
                print("new question", question)
                visualizations = self.visualization_recommender(schema=self.main_dataset.enriched_dataset_schema, question=question)
                visualization_list.extend(visualizations.visualizations)
            return visualization_list
        except Exception as e:
            print("Skipping visualization recommendation because of error: ", e)
            
    def visualization_refine_helper(self, user_message, assistant_message, last_x_questions):
        try:
            print("about to refine visualization")
            
            # TODO: Think if we need to do this for all messages in the chat session
            # TODO: Think if we need PD code here
            
            visualization_list = []
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

            refined_questions = self.question_refiner(enriched_dataset_schema=self.main_dataset.enriched_dataset_schema, chat_context=chat_context, question=current_question)
            for question in refined_questions.questions:
                visualizations = self.visualization_recommender(schema=self.main_dataset.enriched_dataset_schema, question=question)
                visualization_list.extend(visualizations.visualizations)
            return visualization_list
        except Exception as e:
            print("Skipping visualization refinement because of error: ", e)
            
            
    def analyze_visualization(self, assistant_message: AssistantMessageBody):
        analyzer = VisualizationAnalyzer()
        enriched_column_properties = self.get_enriched_extracted_columns(assistant_message.columns_involved)
        png_base64 = json.loads(assistant_message.svg_json).get('png_base64')
        
        analysis = analyzer.analyze(
            png_base64=png_base64,
            enriched_column_properties=enriched_column_properties,
            reason=assistant_message.reason
        )
        
        return analysis
    
    def pandas_code_generator_helper(self, enriched_dataset_schema, visualization_type, columns_involved, viz_docs):
        PANDAS_TRANSFORMATION_TEMPLATE_CODE = """
        import pandas as pd
        import numpy as np
        import os
        import csv
        # <other imports here>
        
        def extract_data(df, columns_involved):
            # <insert code here>
            return extracted_df
            
        extract_df = extract_data(df, columns_involved) # No code beyond this line.
        """

        try:
            pandas_code = self.pandas_code_generator(
                enriched_dataset_schema=enriched_dataset_schema, 
                visualization_type=visualization_type, 
                columns_involved=columns_involved, 
                visualization_docs=viz_docs,
                template_code=PANDAS_TRANSFORMATION_TEMPLATE_CODE
            )
            return pandas_code
        except Exception as e:
            print("Skipping pandas code generation because of error: ", e, visualization_type)
            
            
    def pandas_visualization_code_generator_helper(self, visualization_type, enriched_column_properties, visualization_docs, prev_pd_code, error_prev_pd_code):
        PANDAS_VISUALIZATION_TEMPLATE_CODE = """
        import pandas as pd
        import numpy as np
        import os
        import csv
        
        # <other imports here>
        
        figsize=(6, 4) # Charts should always be of size 6x4.
        
        # <insert code here>
        
        plt.savefig(save_file_name, format='svg')
        plt.close()
        """
        try:
            pandas_code = self.pandas_visualization_code_generator(
                visualization_type=visualization_type, 
                enriched_column_properties=enriched_column_properties, 
                visualization_docs=visualization_docs,
                template_code=PANDAS_VISUALIZATION_TEMPLATE_CODE,
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
    
        
    def get_enriched_extracted_columns(self, extracted_df_columns):
        extracted_df_set = set(extracted_df_columns)
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
        namespace_df = self.main_dataset.df
        save_file_name = f"{visualization.visualization_type}_test.svg"
        
        local_namespace_pd_code = {'pd': pd, 'df': namespace_df, 'plt': plt, 'mplcursors': mplcursors, 'np': np, 'save_file_name': save_file_name, 'columns_involved': visualization.columns_involved}
        
        extracted_df = self.execute_pandas_code(pd_code.pandas_code, local_namespace_pd_code, 'extract_df')
        namespace_df = extracted_df # Update the namespace df for the namespace dict
            
        enriched_extracted_columns = self.get_enriched_extracted_columns(extracted_df.columns.to_list())
        print("enriched_extracted_columns", enriched_extracted_columns)

        try_count = 0
        prev_pd_code = None
        error_prev_pd_code = None
        
        while try_count < 5:
            try:
                enriched_extracted_columns = self.get_enriched_extracted_columns(extracted_df.columns.to_list())
                
                pd_viz_code = self.pandas_visualization_code_generator_helper(
                    visualization.visualization_type,
                    enriched_extracted_columns,
                    viz_docs, 
                    prev_pd_code,
                    error_prev_pd_code
                )
                
                extracted_viz = self.execute_pandas_code(pd_viz_code.pandas_code, local_namespace_pd_code, 'extract_viz')
                
                with open(save_file_name, "r") as f:
                    svg_content = f.read()
                
                # Convert SVG to PNG
                png_bytes = svg2png(bytestring=svg_content.encode('utf-8'))
                png_base64 = base64.b64encode(png_bytes).decode('utf-8')
                
                svg_json = json.dumps({
                    'svg': svg_content,
                    'png_base64': png_base64
                })
                
                assistant_message_body = AssistantMessageBody(
                    reason=visualization.reason,
                    viz_name=visualization.visualization_type,
                    columns_involved=visualization.columns_involved,
                    pd_code=pd_code.pandas_code,
                    pd_viz_code=pd_viz_code.pandas_code,
                    svg_json=svg_json,
                    data=extracted_df.to_dict(orient='records'),
                    extra_attrs={}
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