import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import warnings
import pandas as pd
from pprint import pprint
from llm_agents.helpers import utils 
# import utils
import dspy
import os
from asgiref.sync import sync_to_async
# from chat.models import Dataset as DatasetModel
API_KEY = os.environ.get('OPENAI_API_KEY')
print("api_key", API_KEY)
lm = dspy.LM('openai/gpt-4o-mini', api_key=API_KEY)
dspy.settings.configure(lm=lm)

class DatasetHelper():
    # TODO: Move this to the models file or a helper folder for models. 
    def __init__(self, csv_file_uri, enriched_columns_properties=None, enriched_dataset_schema=None, save_to_db=False) -> None:
        self.summary = None
        self.df = utils.read_dataframe(csv_file_uri)
        self.file_name = csv_file_uri.split("/")[-1]
        self._column_properties = enriched_columns_properties
        self._dataset_schema = enriched_dataset_schema
        self.uri = csv_file_uri
        
        # if save_to_db:
        #     self.dataset_model = DatasetModel.objects.create(name=self.file_name, uri=csv_file_uri, description="new dataset", enriched_columns_properties=self._column_properties, enriched_dataset_schema=self._dataset_schema)

    def check_type(self, dtype: str, value):
        """Cast value to right type to ensure it is JSON serializable"""
        if "float" in str(dtype):
            return float(value)
        elif "int" in str(dtype):
            return int(value)
        else:
            return value
        
    @property
    def enriched_column_properties(self):
        """
            Detailed properties of each column in the dataset.
        """
        if self._column_properties is None:
            self._column_properties = self._calculate_column_properties()
        return self._column_properties

    def _calculate_column_properties(self, n_samples: int = 3) -> list[dict]:
        """Get properties of each column in a pandas DataFrame"""
        self.properties_list = []
        
        for column in self.df.columns:
            dtype = self.df[column].dtype
            properties = {}
            if dtype in [int, float, complex]:
                properties["dtype"] = "number"
                properties["std"] = self.check_type(dtype, self.df[column].std())
                properties["min"] = self.check_type(dtype, self.df[column].min())
                properties["max"] = self.check_type(dtype, self.df[column].max())

            elif dtype == bool:
                properties["dtype"] = "boolean"
            elif dtype == object:
                # Check if the string column can be cast to a valid datetime
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        pd.to_datetime(self.df[column], errors='raise')
                        properties["dtype"] = "date"
                except ValueError:
                    # Check if the string column has a limited number of values
                    if self.df[column].nunique() / len(self.df[column]) < 0.5:
                        properties["dtype"] = "category"
                    else:
                        properties["dtype"] = "string"
            elif pd.api.types.is_categorical_dtype(self.df[column]):
                properties["dtype"] = "category"
            elif pd.api.types.is_datetime64_any_dtype(self.df[column]):
                properties["dtype"] = "date"
            else:
                properties["dtype"] = str(dtype)

            # add min max if dtype is date
            if properties["dtype"] == "date":
                try:
                    properties["min"] = self.df[column].min()
                    properties["max"] = self.df[column].max()
                except TypeError:
                    cast_date_col = pd.to_datetime(self.df[column], errors='coerce')
                    properties["min"] = cast_date_col.min()
                    properties["max"] = cast_date_col.max()
            # Add additional properties to the output dictionary
            nunique = self.df[column].nunique()
            if "samples" not in properties:
                non_null_values = self.df[column][self.df[column].notnull()].unique()
                n_samples = min(n_samples, len(non_null_values))
                samples = pd.Series(non_null_values).sample(
                    n_samples, random_state=42).tolist()
                properties["samples"] = samples
            properties["num_unique_values"] = nunique
            # properties["semantic_type"] = ""
            # properties["description"] = ""
            self.properties_list.append(
                {"column_name": column, "properties": properties})
            
            
        return self.properties_list
    
    @property
    def enriched_dataset_schema(self):
        """
            High level schema of the dataset, with description and semantic_type for each column.
        """
        if self._dataset_schema is None:
            self._dataset_schema = self._update_dataset_schema(self.enriched_column_properties)
            
        return self._dataset_schema
    
    def _update_dataset_schema(self, columns):
        schema_list = []
        for column_dict in columns:
            print(column_dict)
            schema_list.append({"column_name": column_dict["column_name"], "description": column_dict["properties"]["description"], "semantic_type": column_dict["properties"]["semantic_type"]})
        
        return schema_list

    
    @enriched_dataset_schema.setter
    def enriched_dataset_schema(self, new_schema):
        self._dataset_schema = new_schema
        
    @enriched_column_properties.setter
    def enriched_column_properties(self, new_properties_list):
        print("Setting new properties list")
        pprint(new_properties_list)
        self._column_properties = new_properties_list
        
        
class FieldEnrich(dspy.Signature):
    """
        Given JSON of field details, generate JSON for the semantic_type and description of the field.
    """
    field_json = dspy.InputField(desc="JSON of field details.")
    enriched_field_json = dspy.OutputField(desc="JSON for the semantic_type and description of the field. description should be one-liner. semantic_type should be one word with underscore and very descriptive.")
    
#Define a simple signature for basic question answering
class EnrichDatasetDescription(dspy.Signature):
    """
        Update the dataset with dataset_description.
    """
    schema = dspy.InputField(desc="The schema of the dataset")
    dataset_description = dspy.OutputField(desc="One line description of the dataset")
    
class DatasetEnrich(dspy.Module):
    def __init__(self, url: str) -> None:
        self.dataset = DatasetHelper(url)
        self.enriched_field_json = dspy.ChainOfThought(FieldEnrich)
        self.dataset_description = dspy.ChainOfThought(EnrichDatasetDescription)
        
    def enrich_fields(self):
        """
            Enriches each field in the csv with description & semantic_type.
        """
        column_properties_enriched = []
        for column_dict in self.dataset.enriched_column_properties:
            try:
                pred = self.enriched_field_json(field_json=column_dict)
                enriched_fields = json.loads(pred.enriched_field_json)
            except json.decoder.JSONDecodeError:
                print("Error in decoding JSON for column: ", column_dict['column_name'])
                continue
        
            column_dict['properties'] = {**column_dict['properties'], **enriched_fields}
        
            column_properties_enriched.append(column_dict)
                
        self.dataset.enriched_column_properties = column_properties_enriched
        
        # pprint(self.dataset.column_properties)
        
    def enrich_dataset_description(self):
        """
            Enriches the dataset with description.
        """
        pred = self.dataset_description(schema=self.dataset.enriched_dataset_schema)
        self.dataset.enriched_dataset_schema.append({'dataset_description': pred.dataset_description})
        self.dataset.enriched_column_properties.append({'dataset_description': pred.dataset_description})
    
        
    def forward(self) -> dict:
        self.enrich_fields()
        self.enrich_dataset_description()
        
        # Return the enriched dataset information
        print("forwarded properties: ", self.dataset.enriched_column_properties)
        return {
            'enriched_column_properties': self.dataset.enriched_column_properties,
            'enriched_dataset_schema': self.dataset.enriched_dataset_schema
        }
        
if __name__ == "__main__":
    csv_file_uri = "https://raw.githubusercontent.com/uwdata/draco/master/data/cars.csv"
    enrich = DatasetEnrich(csv_file_uri).forward()
    pprint(enrich)
    