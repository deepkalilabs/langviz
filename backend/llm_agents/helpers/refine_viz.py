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
    
@dataclass
class AssistantMessageBody:
    reason: str
    viz_name: str
    pd_code: str
    pd_viz_code: str
    svg_json: str
    columns_involved: List[str]
    
class VisualizationRecommender(dspy.Signature):
    """
        A user wants to refine context from an existing conversation. 
        
        Given the schema of the dataset, the original context, and a followup question, return a list of 1-2 distinct well-thought visualization_types to help respond to the question, the columns involved, and the reason for recommendation. Visualizations must be from the following list: [area_chart, line_chart, bar_chart, pie_chart, scatter_plot_chart, hexbin_chart]. The returned object should follow the Visualization class structure.
        
        class Visualization(BaseModel):
            visualization_type: str
            columns_involved: List[str]
            reason: str
    """
    schema = dspy.InputField(desc="The schema of the dataset.")
    question = dspy.InputField(desc="The question to be answered.")
    original_context = dspy.InputField(desc="Context of original visualization.")
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
