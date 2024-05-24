# Position Prioritization System

This project is an application that analyzes and prioritizes positions capable of firing at a specific target. Positions are scored and ranked according to criteria using the ARAS (Additive Ratio Assessment) method. Positions with the same score are further prioritized based on their distance to the target.

## Description

The Position Prioritization System is designed to assist in military and strategic decision-making by evaluating potential firing positions based on multiple criteria. This system integrates mapping capabilities to allow users to visually add and manage positions and targets. The ARAS method provides a structured approach to scoring these positions, ensuring that the most effective and efficient firing points are prioritized.

## Features

- Add position and target points on the map
- Analyze positions based on their firing range and other criteria
- Score positions using the ARAS method
- Prioritize positions with the same score based on their distance to the target
- Display results visually in a new tab

## Technologies Used

- HTML, CSS, JavaScript
- Leaflet.js (for map integration)
- Bootstrap (for visual enhancements)
- XLSX.js (for handling Excel files)
- LocalStorage (for passing results to the new tab)

## Installation

To run the project locally, follow these steps:

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/position-prioritization-system.git
    cd position-prioritization-system
    ```

2. Open the project files in a browser:
    - Open `index.html` in a web browser.

## Usage

1. Click on the map to add a position or target point.
2. Enter the required information for the position and save it.
3. Select a target and click the analyze button.
4. The analysis results will be displayed on the map and visually in a new tab.

## File Structure

- `index.html`: Main page and map integration.
- `noktascript22.js`: Main JavaScript file.
- `aras_results.html`: Page displaying ARAS analysis results.
- `styles.css`: Stylesheet.

## Contributing

If you would like to contribute, please submit a pull request or open an issue.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more information.
