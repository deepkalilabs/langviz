import dspy
from . import utils
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

API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
N = 1.9
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
        Given the schema of the dataset, a type of visualization, columns involved in the visualization, and a reference signature for the visualization, generate the pandas code to extract and tranform the data for the visualization. The signature is just for reference as it belongs to another dataset. 
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    visualization_type = dspy.InputField(desc="Type of visualization to be generated")
    columns_involved = dspy.InputField(desc="Columns involved in the visualization to be generated")
    reference_signature = dspy.InputField(desc="Reference signature for the visualization from a different dataset for this visualization")
    pandas_code = dspy.OutputField(desc="Python code using Pandas to extract and transform the data from this dataset. Return the extracted data as 'extract_df'.")
    
class DatasetVisualizationsCode(dspy.Signature):
    """
        Given the schema of a dataset and sample visualization code, update the visualization code with the schema of the dataset.
        Return the updated visualization code wrapped in a javascript function that can be embedded in a script.
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    visualization_code = dspy.InputField(desc="Sample visualization code")
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
        visualizations = self.visualization_recommender(schema=self.dataset.dataset_schema, question=question)
        return visualizations
    
    def pandas_code_generator_helper(self, schema, visualization_type, columns_involved):
        d3_chart_signature = open(os.path.join(self.viz_dir, visualization_type, 'contract.py')).read()
        pandas_code = self.pandas_code_generator(schema=schema, visualization_type=visualization_type, columns_involved=columns_involved, reference_signature=d3_chart_signature)
        return pandas_code
    
    def clean_code(self, code):
        return code.strip('`').replace('python', '').strip()

    
    def execute_pandas_code(self, pandas_code):
        local_namespace = {'pd': pd, 'df': self.dataset.df}
        
        cleaned_code = self.clean_code(pandas_code)
        # Remove the triple backticks and 'python' from the string        
        # Execute the code
        exec(cleaned_code, globals(), local_namespace)
        
        # Return the result (scatter_data in this case)
        return local_namespace.get('extract_df')
    
    def visualization_code_generator_helper(self, schema, visualization_type):
        d3_chart_viz_code = open(os.path.join(self.viz_dir, visualization_type, 'chart_code.js')).read()
        updated_viz_code = self.visualization_code_generator(schema=schema, visualization_code=d3_chart_viz_code)
        return updated_viz_code
    
    async def generate_viz(self, schema, visualization):
        try:
            pd_code = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.pandas_code_generator_helper,
                schema, 
                visualization.visualization_type, 
                visualization.columns_involved
            )
            
            extracted_df = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.execute_pandas_code,
                pd_code.pandas_code
            )
            
            viz_name = visualization.visualization_type
            
            js_code = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.visualization_code_generator_helper,
                extracted_df.head(), 
                viz_name
            )
            
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
        results = []
        
        tasks = [self.generate_viz(self.dataset.dataset_schema, visualization) for visualization in viz.visualizations]
        
        results = await asyncio.gather(*tasks)
            
        return [result for result in results if result is not None]
            
    def forward(self):
        results = []
        start_time = time.time()
        if len(self.questions) > 1:
            raise ValueError("More than one questions provided")
        
        results = asyncio.run(self.process_all_visualizations(self.questions[0]))
        print(results)
        # for result in all_results:
        #     print("_________")
        #     for r in result.result():
        #         results.append(r.result())
        
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
    
    enriched_dataset = dataset_enrich.DatasetHelper(csv_file_uri, enrich_schema['column_properties'], enrich_schema['dataset_schema'])
    
    enrich = DatasetVisualizations(enriched_dataset, questions)
    enrich.forward()

    
    

