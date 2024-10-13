from dataclasses import dataclass, field
from typing import List, Union
from collections.abc import Sequence
from datetime import date

@dataclass
class DataPoint:
    Date: date
    Open:  Union[int, float]
    High: Union[int, float]
    Low: Union[int, float]
    Close: Union[int, float]
    Adj_Close: Union[int, float]
    Volume: Union[int, float]

    def __post_init__(self):
        if not isinstance(self.key, date):
            raise TypeError("key must be a date")
        if not all(isinstance(v, float) for v in [self.value, self.value1, self.value2, self.value3, self.value4]):
            raise TypeError("value, value1, value2, value3, and value4 must be floats")
        if not isinstance(self.value5, int):
            raise TypeError("value5 must be an integer")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")

