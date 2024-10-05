from dataclasses import dataclass, field
from typing import List, Union
from collections.abc import Sequence

@dataclass
class DataPoint:
    state: str
    age: str
    population: int

    def __post_init__(self):
        if not isinstance(self.state, str):
            raise TypeError("key must be a string")
        if not isinstance(self.age, str):
            raise TypeError("key1 must be a string")
        if not isinstance(self.population, int):
            raise TypeError("value must be an integer")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")

