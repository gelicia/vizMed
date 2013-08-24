vizMed
======
-data/dataFileGen - the Ruby files that generated all the data files
-data/dataToSQL - the files needed to move data from the spreadsheet format to a database. The definition tables (that are more independent with less foreign keys like drg, apc and provider) were imported directly via a csv dump into a table (/csvFinal). The files that show relationships between those definitions (inpatient, outpatient ) were filled with a script (/convScripts). A full database backup is available under /db and the original files are available under /orig
-data/national - these are the actual files the visualization reads. Each folder has a list of DRGs individually and DRG-All. Under national are a list of states, under each state is a list of cities and under each city is a list of providers in that city. The list of diagnoses for the droplist are under national too.

Uses d3.js, d3.tip and jquery