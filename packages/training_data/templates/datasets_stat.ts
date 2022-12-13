export const datasets_stat = [
    {
        "name": "flights",
        "quantitative": ["DEP_TIME","DEP_DELAY","ARR_TIME","ARR_DELAY","AIR_TIME","DISTANCE"],
        "categorical": ["FLIGHT_DATE"]
    },
    {
        "name": "movies",
        "quantitative": ["US_GROSS","Worldwide_Gross","US_DVD_Sales","Running_Time_min","Rotten_Tomatoes_Rating","Release_Date", "Production_Budget", "IMDB_Rating"],
        "categorical": ["MPAA_Rating", "Distributor", "Source", "Major_Genre", "Creative_Type", "Director"]
    },
    {
        "name": "cars",
        "quantitative": ["MILES_PER_GALLON","CYLINDERS","DISPLACEMENT","HORSEPOWER","Weight_in_lbs","Acceleration", ],
        "categorical": ["Origin", "Year",]
    },
]