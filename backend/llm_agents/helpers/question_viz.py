import dspy
from . import utils
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

API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY)
dspy.settings.configure(lm=lm)

@dataclass
class Visualization(BaseModel):
    visualization: str
    columns_involved: List[str]
    reason: str

class VisualizationRecommender(dspy.Signature):
    """
        Given the schema of the dataset and a question, recommend 4 well-thought visualization to help understand the question, the columns involved, and the reason for recommendation. Pick between area_chart, line_chart, simple_bar_chart, candle_stick_chart, pie_chart, stack_bar_chart, group_bar_chart, scatter_plot_chart, stacked_area_chart.
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    question = dspy.InputField(desc="The question to be answered")
    visualizations: list[Visualization] = dspy.OutputField(desc="List of dictionairies with visualizations, columns involved & reason for the visualization.")
    
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
        self.viz_dir = os.path.join(os.getcwd(), 'example_charts')
        self.visualization_recommender = dspy.ChainOfThought(VisualizationRecommender)
        self.pandas_code_generator = dspy.ChainOfThought(PandasTransformationCode)
        self.visualization_code_generator = dspy.ChainOfThought(DatasetVisualizationsCode)
        self.questions = questions
        self.viz_data_code = {}
        
    def visualization_recommender_helper(self, question: str):
        visualizations = self.visualization_recommender(schema=self.dataset.dataset_schema, question=question)
        return visualizations
    
    def pandas_code_generator_helper(self, schema, visualization, columns_involved):
        d3_chart_signature = open(os.path.join(self.viz_dir, visualization, 'contract.py')).read()
        pandas_code = self.pandas_code_generator(schema=schema, visualization_type=visualization, columns_involved=columns_involved, reference_signature=d3_chart_signature)
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
    
    def visualization_code_generator_helper(self, schema, visualization):
        d3_chart_viz_code = open(os.path.join(self.viz_dir, visualization, 'chart_code.js')).read()
        updated_viz_code = self.visualization_code_generator(schema=schema, visualization_code=d3_chart_viz_code)
        return updated_viz_code

        
    def forward(self) -> dict:
        for question in self.questions:
            viz = self.visualization_recommender_helper(question)
            for visualization in viz.visualizations:
                try:
                    pd_code = self.pandas_code_generator_helper(self.dataset.dataset_schema, visualization.visualization, visualization.columns_involved)
                    extracted_df = self.execute_pandas_code(pd_code.pandas_code)
                    viz_name = visualization.visualization
                    js_code = self.visualization_code_generator_helper(extracted_df.head(), viz_name)
                    
                    self.viz_data_code[viz_name] = {
                        'data': extracted_df,
                        'js_code': js_code.final_visualization_code,
                        'pd_code': pd_code.pandas_code
                    }

                except Exception as e:
                    print("Skipping this visualization because of error: ", e, visualization)
                    continue
                
                print(f"data for {viz_name}")
                print("----------------------------------------")
                print("Columns involved: ", visualization.columns_involved)
                print(extracted_df)
                print("----------------------------------------")
                # print(js_code.final_visualization_code)
                        
        return self.viz_data_code
            

if __name__ == "__main__":
    lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY)
    dspy.settings.configure(lm=lm)
    csv_file_uri = "https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv"
    questions = [
            "How does engine size correlate with fuel efficiency (city and highway) across different vehicle types?",
            # "What is the distribution of retail prices across different vehicle types, and how does it compare to dealer costs?",
            # "How does the horsepower-to-weight ratio vary among different vehicle types, and is there a correlation with retail price?",
            # "What is the relationship between a vehicle's physical dimensions (length, width, wheelbase) and its fuel efficiency?"
        ]
    
    import dataset_enrich        
    
    enrich_schema = dataset_enrich.DatasetEnrich(csv_file_uri).forward()
    
    enriched_dataset = dataset_enrich.DatasetHelper(csv_file_uri, enrich_schema['column_properties'], enrich_schema['dataset_schema'])
    
    enrich = DatasetVisualizations(enriched_dataset, questions)
    print(enrich.forward())

    
    

