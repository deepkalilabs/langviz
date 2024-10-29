"""
# Creating Styled Tables with Pandas and Matplotlib
A comprehensive guide to creating and styling tables using pandas and matplotlib libraries.

## Table of Contents
1. [Basic Table Creation](#basic-table-creation)
2. [Conditional Styling](#conditional-styling)
3. [Custom Color Maps](#custom-color-maps)
4. [Advanced Formatting](#advanced-formatting)
5. [Saving Tables](#saving-tables)

## Basic Table Creation

### Simple Table with Default Styling
"""

import pandas as pd
import matplotlib.pyplot as plt

# Create sample data
data = {
    'Name': ['John', 'Emma', 'Alex', 'Sarah'],
    'Age': [28, 24, 32, 27],
    'Salary': [65000, 45000, 85000, 55000],
    'Department': ['IT', 'HR', 'Finance', 'Marketing']
}

df = pd.DataFrame(data)

# Create figure and axis
fig, ax = plt.subplots(figsize=(8, 4))

# Hide axes
ax.axis('tight')
ax.axis('off')

# Create table
table = ax.table(cellText=df.values,
                colLabels=df.columns,
                cellLoc='center',
                loc='center')

# Basic styling
table.auto_set_font_size(False)
table.set_fontsize(9)
table.scale(1.2, 1.5)

plt.show()

## Conditional Styling

### Table with Color-coded Values
import numpy as np

def create_styled_table(df, highlight_threshold):
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.axis('tight')
    ax.axis('off')
    
    # Create table
    table = ax.table(cellText=df.values,
                    colLabels=df.columns,
                    cellLoc='center',
                    loc='center')
    
    # Apply conditional formatting
    for i in range(len(df)):
        cell = table[i+1, 2]  # Salary column (index 2)
        if df.iloc[i]['Salary'] > highlight_threshold:
            cell.set_facecolor('#a8e6cf')  # Light green
        else:
            cell.set_facecolor('#ffd3b6')  # Light orange
    
    # Style header
    for j in range(len(df.columns)):
        table[0, j].set_facecolor('#3d5a80')
        table[0, j].set_text_props(color='white')
    
    # Adjust layout
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.2, 1.5)
    
    return fig, ax, table

# Example usage
fig, ax, table = create_styled_table(df, 60000)
plt.show()

## Custom Color Maps

### Gradient-based Table Styling
def create_gradient_table(df, column_name):
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.axis('tight')
    ax.axis('off')
    
    # Create table
    table = ax.table(cellText=df.values,
                    colLabels=df.columns,
                    cellLoc='center',
                    loc='center')
    
    # Calculate color gradient
    column_values = df[column_name]
    min_val = column_values.min()
    max_val = column_values.max()
    
    # Apply gradient colors
    column_idx = df.columns.get_loc(column_name)
    for i in range(len(df)):
        value = df.iloc[i][column_name]
        normalized_value = (value - min_val) / (max_val - min_val)
        rgb = plt.cm.RdYlBu(normalized_value)  # Using RdYlBu colormap
        cell = table[i+1, column_idx]
        cell.set_facecolor(rgb)
    
    # Style header
    for j in range(len(df.columns)):
        table[0, j].set_facecolor('#2b2d42')
        table[0, j].set_text_props(color='white')
    
    # Adjust layout
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.2, 1.5)
    
    return fig, ax, table

# Example usage
fig, ax, table = create_gradient_table(df, 'Salary')
plt.show()

## Advanced Formatting

### Custom Cell Styling and Borders
def create_advanced_table(df):
    fig, ax = plt.subplots(figsize=(12, 6))
    ax.axis('tight')
    ax.axis('off')
    
    # Format numeric values
    df_formatted = df.copy()
    df_formatted['Salary'] = df_formatted['Salary'].apply(lambda x: f"${x:,.2f}")
    
    table = ax.table(cellText=df_formatted.values,
                    colLabels=df_formatted.columns,
                    cellLoc='center',
                    loc='center')
    
    # Custom styling
    for i in range(len(df) + 1):  # +1 for header
        for j in range(len(df.columns)):
            cell = table[i, j]
            cell.set_edgecolor('black')
            
            if i == 0:  # Header row
                cell.set_facecolor('#003049')
                cell.set_text_props(color='white', weight='bold')
                cell.set_height(0.15)
            else:  # Data rows
                if i % 2 == 0:
                    cell.set_facecolor('#eae2b7')
                else:
                    cell.set_facecolor('#fcbf49')
    
    # Adjust layout
    table.auto_set_font_size(False)
    table.set_fontsize(9)
    table.scale(1.2, 1.5)
    
    plt.title('Employee Information', pad=20)
    return fig, ax, table

# Example usage
fig, ax, table = create_advanced_table(df)
plt.show()

## Saving Tables

### Export Table as Image
def save_table_as_image(fig, filename, dpi=300):
    """
    Save the table as a high-resolution image
    
    Parameters:
    -----------
    fig : matplotlib.figure.Figure
        The figure containing the table
    filename : str
        Output filename (e.g., 'table.png')
    dpi : int
        Resolution of the output image
    """
    plt.tight_layout()
    fig.savefig(filename, 
                dpi=dpi, 
                bbox_inches='tight',
                pad_inches=0.5)
    
# Example usage
fig, ax, table = create_advanced_table(df)
save_table_as_image(fig, 'styled_table.png')

"""
## Best Practices and Tips

1. **Figure Size**: Adjust `figsize` based on the amount of data and desired table size
2. **Font Size**: Use `set_fontsize()` to ensure text is readable
3. **Color Selection**: Choose colorblind-friendly color schemes
4. **Scale**: Use `table.scale()` to adjust cell sizes proportionally
5. **Borders**: Add borders to improve readability
6. **Text Formatting**: Format numbers and text appropriately for better presentation

## Common Issues and Solutions

1. **Text Overflow**: 
   - Decrease font size
   - Increase figure size
   - Wrap text using custom cell formatting

2. **Color Contrast**:
   - Ensure sufficient contrast between text and background
   - Use colorblind-friendly palettes
   - Test with different color schemes

3. **Alignment Issues**:
   - Use `cellLoc` parameter to control alignment
   - Adjust table scaling
   - Modify cell heights/widths individually if needed
"""