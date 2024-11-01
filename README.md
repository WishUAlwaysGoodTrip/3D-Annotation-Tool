# 3D-Annotation-Tool

## Project Overview
The 3D Tooth Annotation Tool is a specialized software application designed for labeling and annotating 3D models of teeth. This tool enables users to mark, categorize, and label different areas of a tooth model in a 3D environment, storing annotations in a JSON format for further analysis, such as machine learning applications.

This tool aims to streamline the process of dental model annotation, making it easy to classify different areas and types of teeth for medical, research, and training purposes.

## Key Features

- **3D Model Upload**: Supports uploading 3D tooth models from files or folders, allowing users to easily manage multiple models.
- **Intuitive Toolbar**: Provides various tools such as:
  - **Point Selection**: Click to highlight single or multiple points.
  - **Face Line**: Select single faces or the shortest path between two faces.
  - **Paint**: Quickly label large areas by "painting" over the model.
  - **Erase**: Remove painted areas with ease.
  - **Rotate**: Rotate, zoom, and move the model to view and label it from different angles.
- **Annotation Panel**: Allows users to define custom labels and classifications for each tooth, specifying details like health status or problem type.
- **Color Coding**: Customize label colors for easy visual identification.
- **File Management**: Highlights completed files and provides an option to hide the file list for a cleaner workspace.
- **Save and Auto-Save**: Easily save work with a button or keyboard shortcut (`Ctrl/Command + S`). A pop-up reminder will appear if unsaved changes exist when exiting the application.

## Usage

1. **Run the Tool**: Begin by running the provided code. Future versions will include an easy-to-install package for streamlined setup.
2. **Upload a Model**: Open a 3D tooth model by uploading files or folders.
3. **Explore and Label**: Use the toolbar tools to select points, label faces, paint large areas, erase, and rotate the model as needed.
4. **Define Annotations**: In the annotation panel, create classification names, assign colors, and apply annotations to specific teeth or regions.
5. **Save Annotations**: Save your work manually or rely on the auto-save reminder when exiting the tool.

## Getting started
1. Clone the files
2. Run `npm i` inside the project
3. Then `npm run electron` to start in development env.

Or
1. Clone the files
2. Run `npm i` inside the project
3. Then `npm run electron` to build
4. And run `npm run electron-start` to start

## License

This project is licensed under Asiga, Sydney.

