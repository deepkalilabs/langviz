def pie(self, **kwargs) -> PlotAccessor:
    """
    Generate a pie plot.

    A pie plot is a proportional representation of the numerical data in a
    column. This function wraps :meth:`matplotlib.pyplot.pie` for the
    specified column. If no column reference is passed and
    ``subplots=True`` a pie plot is drawn for each numerical column
    independently.

    Parameters
    ----------
    y : int or label, optional
        Label or position of the column to plot.
        If not provided, ``subplots=True`` argument must be passed.
    **kwargs
        Keyword arguments to pass on to :meth:`DataFrame.plot`.

    Returns
    -------
    matplotlib.axes.Axes or np.ndarray of them
        A NumPy array is returned when `subplots` is True.

    See Also
    --------
    Series.plot.pie : Generate a pie plot for a Series.
    DataFrame.plot : Make plots of a DataFrame.

    Examples
    --------
    In the example below we have a DataFrame with the information about
    planet's mass and radius. We pass the 'mass' column to the
    pie function to get a pie plot.

    .. plot::
        :context: close-figs

        >>> df = pd.DataFrame({'mass': [0.330, 4.87 , 5.97],
        ...                    'radius': [2439.7, 6051.8, 6378.1]},
        ...                   index=['Mercury', 'Venus', 'Earth'])
        >>> plot = df.plot.pie(y='mass', figsize=(5, 5))

    .. plot::
        :context: close-figs

        >>> plot = df.plot.pie(subplots=True, figsize=(11, 6))
    """
    if (
        isinstance(self._parent, ABCDataFrame)
        and kwargs.get("y", None) is None
        and not kwargs.get("subplots", False)
    ):
        raise ValueError("pie requires either y column or 'subplots=True'")
    return self(kind="pie", **kwargs)
