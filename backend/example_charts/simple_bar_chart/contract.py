from dataclasses import dataclass, field
from typing import List, Union
from collections.abc import Sequence

@dataclass
class DataPoint:
    letter: str
    frequency: Union[int, float]

    def __post_init__(self):
        if not isinstance(self.key, str):
            raise TypeError("key must be a string")
        if not isinstance(self.value, (int, float)):
            raise TypeError("value must be an int or float")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")

