import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
N = 2.2
lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY, temperature=0.001*N)
dspy.settings.configure(lm=lm)

@dataclass
class Visualization(BaseModel):
    visualization_type: str
    columns_involved: List[str]
    reason: str

class VisualizationRecommender(dspy.Signature):
    """
        Given the schema of the dataset and a question, return a list of 4 well-thought visualization_types to help understand the question, the columns involved, and the reason for recommendation. The returned object should follow the Visualization class structure.
        
        class Visualization(BaseModel):
            visualization_type: str
            columns_involved: List[str]
            reason: str
        
        Pick between area_chart, line_chart, simple_bar_chart, candle_stick_chart, pie_chart, stack_bar_chart, group_bar_chart, scatter_plot_chart, stacked_area_chart.
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    question = dspy.InputField(desc="The question to be answered")
    visualizations: list[Visualization] = dspy.OutputField(desc="List of dictionaries (List[Dict]) with visualizations, columns involved & reason for the visualization.")
    
class PandasTransformationCode(dspy.Signature):
    """
        Given the schema of the dataset, a type of visualization, columns involved in the visualization, a reference signature for the visualization, and the EXACT javascript code where this data will be used, generate the pandas code to extract and tranform the data for the visualization. Make sure the pandas code is compatible with the run_js_code and the pandas_code generates an iterable list.
        
        The signature is just for reference as it belongs to another dataset. 
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
    visualization_type = dspy.InputField(desc="Type of visualization to be generated")
    columns_involved = dspy.InputField(desc="Columns involved in the visualization to be generated")
    reference_signature = dspy.InputField(desc="Reference signature for the visualization from a different dataset for this visualization")
    run_js_code = dspy.InputField(desc="Javascript code where this data will be used to run the visualization")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to extract and transform the data from this dataset. Return the extracted data as 'extract_df'. The data format should be compatible with the run_js_code.")
    
class DatasetVisualizationsCode(dspy.Signature):
    """
        Given the schema of a dataset and sample visualization code, update the visualization code with the schema of the dataset.
        This code will be used as a template string in a React component.
        Please clean and format the following D3 code so it can be used as a template string in a React component. Follow these guidelines:

        1. Wrap the entire code in a function that takes 'data' as its only parameter.
        2. Ensure the function returns the SVG node (typically svg.node()).
        3. Escape all backticks (`) within the code by preceding them with a backslash (\`).
        4. Escape all dollar signs ($) used in template literals within the code by preceding them with a backslash (\$).
        5. Maintain proper indentation for readability.
        6. Remove any 'use strict' statements or other unnecessary declarations.
        7. Ensure all variables are properly declared (const, let, var).
        8. If the code uses any external functions or variables not defined within the provided code, assume they are available in the scope and leave them as is.
        9. Do not modify the core functionality of the D3 code.
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
    dataset_columns = dspy.InputField(desc="The columns of the dataset used for the visualization")
    visualization_code = dspy.InputField(desc="Sample D3 code from a different dataset for this visualization")
    final_visualization_code = dspy.OutputField(desc="Updated visualization code with the schema of the dataset.")
    

class DatasetVisualizations(dspy.Module):
    def __init__(self, dataset, questions: list) -> None:
        self.dataset = dataset
        self.viz_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'example_charts')
        print("viz_dir", self.viz_dir)
        self.visualization_recommender = dspy.ChainOfThought(VisualizationRecommender)
        self.pandas_code_generator = dspy.ChainOfThought(PandasTransformationCode)
        self.visualization_code_generator = dspy.ChainOfThought(DatasetVisualizationsCode)
        self.questions = questions
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)
        self.question_viz_details = {}
        
    def visualization_recommender_helper(self, question: str):
        try:
            visualizations = self.visualization_recommender(schema=self.dataset.enriched_dataset_schema, question=question)
            return visualizations
        except Exception as e:
            print("Skipping visualization recommendation because of error: ", e)
    
    def pandas_code_generator_helper(self, enriched_dataset_schema, visualization_type, run_js_code, columns_involved):
        try:
            d3_chart_signature = open(os.path.join(self.viz_dir, visualization_type, 'contract.py')).read()
            pandas_code = self.pandas_code_generator(
                enriched_dataset_schema=enriched_dataset_schema, 
                visualization_type=visualization_type, 
                run_js_code=run_js_code, 
                columns_involved=columns_involved, 
                reference_signature=d3_chart_signature
            )
            return pandas_code
        except Exception as e:
            print("Skipping pandas code generation because of error: ", e, visualization_type)
    
    def clean_code(self, code):
        return code.strip('`').replace('python', '').strip()

    
    def execute_pandas_code(self, pandas_code):
        df = utils.read_dataframe(self.dataset.uri)
        local_namespace = {'pd': pd, 'df': df}
        
        cleaned_code = self.clean_code(pandas_code)
        # Remove the triple backticks and 'python' from the string        
        # Execute the code
        exec(cleaned_code, globals(), local_namespace)
        
        # Return the result (scatter_data in this case)
        return local_namespace.get('extract_df')
    
    def visualization_code_generator_helper(self, enriched_dataset_schema, dataset_columns, visualization_type):
        try:
            d3_chart_viz_code = open(os.path.join(self.viz_dir, visualization_type, 'chart_code.js')).read()
            updated_viz_code = self.visualization_code_generator(
                enriched_dataset_schema=enriched_dataset_schema, 
                dataset_columns=dataset_columns, 
                visualization_code=d3_chart_viz_code
            )
            return updated_viz_code
        except Exception as e:
            print("Skipping viz code generation because of error: ", e, visualization_type)
    
    async def generate_viz(self, enriched_dataset_schema, visualization):
        try:
            js_code = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.visualization_code_generator_helper,
                enriched_dataset_schema,
                visualization.columns_involved, 
                visualization.visualization_type
            )
            
            pd_code = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.pandas_code_generator_helper,
                enriched_dataset_schema, 
                visualization.visualization_type,
                js_code.final_visualization_code,
                visualization.columns_involved
            )
            
            extracted_df = self.execute_pandas_code(pd_code.pandas_code)
            
            viz_name = visualization.visualization_type
            
            return {
                'viz_name': viz_name,
                'data': extracted_df,
                'js_code': js_code.final_visualization_code,
                'pd_code': pd_code.pandas_code
            }
        except Exception as e:
            print("Skipping this visualization because of error: ", e, visualization)

    
    async def process_all_visualizations(self, question):
        viz = self.visualization_recommender_helper(question)
        
        for visualization in viz.visualizations:
            result = await self.generate_viz(self.dataset.enriched_dataset_schema, visualization)
            print(result)
            yield result
            
    def forward(self):
        start_time = time.time()
        if len(self.questions) > 1:
            raise ValueError("More than one questions provided")
        
        results = []
        
        # asyncio.run(self.process_all_visualizations(self.questions[0]))
        
        for result in self.process_all_visualizations(self.questions[0]):
            results.append(result)
        
        end_time = time.time()
        print(f"Time taken: {end_time - start_time:.2f} seconds") 
        return results
    
if __name__ == "__main__":
    lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY)
    dspy.settings.configure(lm=lm)
    csv_file_uri = "https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv"
    questions = [
            "How does engine size correlate with fuel efficiency for both city and highway across different vehicle types?",
            # "What is the distribution of retail prices across different vehicle types, and how does it compare to dealer costs?",
            # "How does the horsepower-to-weight ratio vary among different vehicle types, and is there a correlation with retail price?",
            # "What is the relationship between a vehicle's physical dimensions (length, width, wheelbase) and its fuel efficiency?"
        ]
    
    import dataset_enrich        
    
    enrich_schema = dataset_enrich.DatasetEnrich(csv_file_uri).forward()
    
    enriched_dataset = dataset_enrich.DatasetHelper(csv_file_uri, enrich_schema['enriched_column_properties'], enrich_schema['enriched_dataset_schema'])
    
    enrich = DatasetVisualizations(enriched_dataset, questions)
    enrich.forward()

    
    

