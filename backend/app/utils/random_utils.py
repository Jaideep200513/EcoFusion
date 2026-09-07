import random
import numpy as np


def seed_everything(seed: int = 42) -> None:
    """
    Seed Python standard random and NumPy generators for 100% reproducible simulations.
    """
    random.seed(seed)
    np.random.seed(seed)


def get_seeded_random(seed: int) -> random.Random:
    """
    Return an isolated Random instance seeded with the given integer.
    """
    return random.Random(seed)
