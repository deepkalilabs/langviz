from dataclasses import dataclass, field
from typing import List, Union
from collections.abc import Sequence
from datetime import date

@dataclass
class DataPoint:
    date: Union[int, float, date]
    close: Union[int, float]

    def __post_init__(self):
        if not isinstance(self.key, (int, float, date)):
            raise TypeError("key must be an int, float, or date")
        if not isinstance(self.value, float):
            raise TypeError("value must be a float")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")

