from dataclasses import dataclass, field
from typing import List
from collections.abc import Sequence
from datetime import date

@dataclass
class DataPoint:
    date: date
    industry: str
    unemployed: int

    def __post_init__(self):
        if not isinstance(self.date, date):
            raise TypeError("date must be a date")
        if not isinstance(self.industry, str):
            raise TypeError("industry must be a string")
        if not isinstance(self.unemployed, int):
            raise TypeError("unemployed must be an integer")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")
