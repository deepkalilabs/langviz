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
import matplotlib.pyplot as plt
import mplcursors
import numpy as np
API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
N = 8
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
        
        Only pick between area_chart, line_chart, bar_chart, pie_chart, scatter_plot_chart, hexbin_chart.
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    question = dspy.InputField(desc="The question to be answered")
    visualizations: list[Visualization] = dspy.OutputField(desc="List of dictionaries (List[Dict]) with visualizations, columns involved & reason for the visualization.")
    
class PandasTransformationCode(dspy.Signature):
    """
        Given the schema of the master dataset, a type of visualization and its docs, and columns involved in the visualization, generate the pandas code to extract and tranform the data in dataframe df. Use the df variable from local namespace to extract the data. return the df in the fomrat that is compatible with the visualization docs. Do not change the column names.
    """
    enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
    visualization_type = dspy.InputField(desc="Type of visualization to be generated")
    columns_involved = dspy.InputField(desc="Columns involved in the visualization to be generated")
    visualization_docs = dspy.InputField(desc="Pandas reference docs and code for the visualization for a different dataset")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to extract, clean, and transform the data in dataframe df. The code should return the extracted data in a format compatible with pandas visualization code as shown in the visualization docs. Return variable name should be extract_df. Keep the column names as is.")
    
class PandasVisualizationCode(dspy.Signature):
    """
        Given a visualization type, details of columns involved in the visualization, and sample docs for pandas code to generate this visualization, return well-thought and clean pandas code to generate this visualization using best practices. Please follow the following instructions strictly:
        
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
    
# class DatasetVisualizationsCode(dspy.Signature):
#     """
#         Given the schema of a dataset and sample visualization code, update the visualization code with the schema of the dataset. 
        
#         This code will be used as a template string in a React component.
            
#             1. Wrap the entire code in a function that takes 'data' as its only parameter.
#             2. The function returns the SVG node (typically svg.node()).
#             3. Escape all backticks (`) within the code by preceding them with a backslash (\`).
#             4. Escape all dollar signs ($) used in template literals within the code by preceding them with a backslash (\$).
#             5. Maintain proper indentation for readability.
#             6. Remove any 'use strict' statements or other unnecessary declarations.
#             7. Ensure all variables are properly declared (const, let, var).
#             8. If the code uses any external functions or variables not defined within the provided code, assume they are available in the scope and leave them as is.
#             9. Do not modify the core functionality of the D3 code.

#     """
#     enriched_dataset_schema = dspy.InputField(desc="The enriched schema of the entire dataset")
#     dataset_columns = dspy.InputField(desc="The columns of the dataset used for the visualization")
#     visualization_code = dspy.InputField(desc="Sample D3 code from a different dataset for this visualization")
#     final_visualization_code = dspy.OutputField(desc="Updated visualization code with the schema of the dataset.")
    

class DatasetVisualizations(dspy.Module):
    def __init__(self, dataset, questions: list) -> None:
        self.main_dataset = dataset
        self.viz_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'example_charts_pd')

        self.visualization_recommender = dspy.ChainOfThought(VisualizationRecommender)
        self.pandas_code_generator = dspy.ChainOfThought(PandasTransformationCode)
        self.pandas_visualization_code_generator = dspy.ChainOfThought(PandasVisualizationCode)
        # self.visualization_code_generator = dspy.ChainOfThoughtWithHint(DatasetVisualizationsCode) #, hint=hint)
        self.questions = questions
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)
        self.question_viz_details = {}
        
    
    def visualization_recommender_helper(self, question: str):
        try:
            visualizations = self.visualization_recommender(schema=self.main_dataset.enriched_dataset_schema, question=question)
            return visualizations
        except Exception as e:
            print("Skipping visualization recommendation because of error: ", e)
    
    
    def pandas_code_generator_helper(self, enriched_dataset_schema, visualization_type, columns_involved, viz_docs):
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
    
    
    async def generate_viz(self, enriched_dataset, visualization):
        if os.path.exists(os.path.join(self.viz_dir, f"{visualization.visualization_type}.py")):
            viz_docs = open(os.path.join(self.viz_dir, f"{visualization.visualization_type}.py")).read()            
        elif os.path.exists(os.path.join(self.viz_dir, f"{visualization.visualization_type}_chart.py")):
            viz_docs = open(os.path.join(self.viz_dir, f"{visualization.visualization_type}_chart.py")).read()
        else:
            raise ValueError(f"No visualization docs found for {visualization.visualization_type}")
            
        try:
            pd_code = self.pandas_code_generator_helper(
                enriched_dataset.enriched_dataset_schema, 
                visualization.visualization_type,
                visualization.columns_involved,
                viz_docs
            )
            print("pd_code", pd_code)
        except Exception as e:
            print("Skipping pandas code execution because of error: ", e, visualization)
        
        try:
            print("self.main_dataset.df", self.main_dataset)
            local_namespace = {'pd': pd, 'df': enriched_dataset.df, 'plt': plt}
            extracted_df = self.execute_pandas_code(pd_code.pandas_code, local_namespace, 'extract_df')
            print("extracted_df_list", extracted_df)
        except Exception as e:
            print("Skipping dataframe extraction because of error: ", e, visualization)
            
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
                return {
                    'viz_name': visualization.visualization_type,
                    'data': extracted_df,
                    'pd_code': pd_code.pandas_code,
                    'pd_viz_code': pd_viz_code.pandas_code,
                    'svg_json': svg_json
                }
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
        if len(self.questions) > 1:
            raise ValueError("More than one questions provided")
        
        results = []
        
        asyncio.run(self.process_all_visualizations(self.questions[0]))
        
        # results = [result for result in self.process_all_visualizations(self.questions[0])]
        
        end_time = time.time()
        print(f"Time taken: {end_time - start_time:.2f} seconds") 
        return results
    
if __name__ == "__main__":
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

    
    

