"""
    See Also
    --------
    DataFrame.plot.barh : Horizontal bar plot.
    DataFrame.plot : Make plots of a DataFrame.
    matplotlib.pyplot.bar : Make a bar plot with matplotlib.

    Examples
    --------
    Basic plot.

    .. plot::
        :context: close-figs

        >>> df = pd.DataFrame({'lab':['A', 'B', 'C'], 'val':[10, 30, 20]})
        >>> ax = df.plot.bar(x='lab', y='val', rot=0)

    Plot a whole dataframe to a bar plot. Each column is assigned a
    distinct color, and each row is nested in a group along the
    horizontal axis.

    .. plot::
        :context: close-figs

        >>> speed = [0.1, 17.5, 40, 48, 52, 69, 88]
        >>> lifespan = [2, 8, 70, 1.5, 25, 12, 28]
        >>> index = ['snail', 'pig', 'elephant',
        ...          'rabbit', 'giraffe', 'coyote', 'horse']
        >>> df = pd.DataFrame({'speed': speed,
        ...                    'lifespan': lifespan}, index=index)
        >>> ax = df.plot.bar(rot=0)

    Plot stacked bar charts for the DataFrame

    .. plot::
        :context: close-figs

        >>> ax = df.plot.bar(stacked=True)

    Instead of nesting, the figure can be split by column with
    ``subplots=True``. In this case, a :class:`numpy.ndarray` of
    :class:`matplotlib.axes.Axes` are returned.

    .. plot::
        :context: close-figs

        >>> axes = df.plot.bar(rot=0, subplots=True)
        >>> axes[1].legend(loc=2)  # doctest: +SKIP

    If you don't like the default colours, you can specify how you'd
    like each column to be colored.

    .. plot::
        :context: close-figs

        >>> axes = df.plot.bar(
        ...     rot=0, subplots=True, color={"speed": "red", "lifespan": "green"}
        ... )
        >>> axes[1].legend(loc=2)  # doctest: +SKIP

    Plot a single column.

    .. plot::
        :context: close-figs

        >>> ax = df.plot.bar(y='speed', rot=0)

    Plot only selected categories for the DataFrame.

    .. plot::
        :context: close-figs

        >>> ax = df.plot.bar(x='lifespan', rot=0)
"""
)
@Substitution(kind="bar")
@Appender(_bar_or_line_doc)
def bar(  # pylint: disable=disallowed-name
    self, x: Hashable | None = None, y: Hashable | None = None, **kwargs
) -> PlotAccessor:
    """
    Vertical bar plot.

    A bar plot is a plot that presents categorical data with
    rectangular bars with lengths proportional to the values that they
    represent. A bar plot shows comparisons among discrete categories. One
    axis of the plot shows the specific categories being compared, and the
    other axis represents a measured value.
    """
    return self(kind="bar", x=x, y=y, **kwargs)