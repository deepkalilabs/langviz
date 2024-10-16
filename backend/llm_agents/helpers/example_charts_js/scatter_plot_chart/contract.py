from dataclasses import dataclass, field
from typing import List
from collections.abc import Sequence

@dataclass
class DataPoint:
    sepalLength: float
    sepalWidth: float
    petalLength: float
    petalWidth: float
    species: str

    def __post_init__(self):
        if not all(isinstance(v, float) for v in [self.sepalLength, self.sepalWidth, self.petalLength, self.petalWidth]):
            raise TypeError("sepalLength, sepalWidth, petalLength, and petalWidth must be floats")
        if not isinstance(self.species, str):
            raise TypeError("species must be a string")

@dataclass
class Dataset:
    data: List[DataPoint] = field(default_factory=list)

    def __post_init__(self):
        if not isinstance(self.data, Sequence):
            raise TypeError("data must be a sequence")
        for item in self.data:
            if not isinstance(item, DataPoint):
                raise TypeError("All items in data must be DataPoint instances")

