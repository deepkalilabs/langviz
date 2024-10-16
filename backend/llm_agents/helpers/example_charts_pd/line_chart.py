"""
    See Also
    --------
    matplotlib.pyplot.plot : Plot y versus x as lines and/or markers.

    Examples
    --------

    .. plot::
        :context: close-figs

        >>> s = pd.Series([1, 3, 2])
        >>> s.plot.line()  # doctest: +SKIP

    .. plot::
        :context: close-figs

        The following example shows the populations for some animals
        over the years.

        >>> df = pd.DataFrame({
        ...    'pig': [20, 18, 489, 675, 1776],
        ...    'horse': [4, 25, 281, 600, 1900]
        ...    }, index=[1990, 1997, 2003, 2009, 2014])
        >>> lines = df.plot.line()

    .. plot::
        :context: close-figs

        An example with subplots, so an array of axes is returned.

        >>> axes = df.plot.line(subplots=True)
        >>> type(axes)
        <class 'numpy.ndarray'>

    .. plot::
        :context: close-figs

        Let's repeat the same example, but specifying colors for
        each column (in this case, for each animal).

        >>> axes = df.plot.line(
        ...     subplots=True, color={"pig": "pink", "horse": "#742802"}
        ... )

    .. plot::
        :context: close-figs

        The following example shows the relationship between both
        populations.

    >>> lines = df.plot.line(x='pig', y='horse')
"""
@Substitution(kind="line")
@Appender(_bar_or_line_doc)
def line(
    self, x: Hashable | None = None, y: Hashable | None = None, **kwargs
) -> PlotAccessor:
    """
    Plot Series or DataFrame as lines.

    This function is useful to plot lines using DataFrame's values
    as coordinates.
    """
    return self(kind="line", x=x, y=y, **kwargs)

