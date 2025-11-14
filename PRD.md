A desktop app that can connect to Oracle Fusion and Execute Queries
It will have similar features like CloudMiner and SQL Connect from Splash BI
Details of cloud miner can be found here https://rite.digital/products/cloudminer/
Details of SQL Connect by Splash BI can be found here https://sqlconnect.com/
I want an interface similar to Oracle SQL Developer, but much more modern
The user should be able to manage connections both existin and new
For new connections the user should be able to give a connection name, url, username and password
The url should end with oraclecloud.com. If It doesn't please provide a message that it should.
We should also give the option to connect using SSO
All credentials should be stored in the user's sytem
Credentials should be encyrpted and stored
Always use https
For existing connections the user should be able to edit the name, url and password
The left pane should have the connections and the list of objects (tables, views and data models)
Data models should be grouped based on the folders in the BI catalog
The editor section should include line numbers and syntax highlighting for SQL and PL/SQL
The bottom section should show the results of the query
There should be an option to export the results to csv, excel and json
A filter option should be available for each column
Sorting option should be available for each column
By default the results should be shown in a table view
There should be an option to view individual records and should have nagivation options to loop through each record
There should be an option to right click on a column header and copy the column header
There should be an option to select multiple columns and then copy the column names into the editor
There should be an option for dark theme
The user should be able to set the font size and font type in settings
The user should be able to save the SQL as a file
You will be using BI Publisher Web Services
store the sql queries executed in a history (keep the latest 100 queries by connection)
The user should be able to search in the history for keywords
From the history the user should be able to insert the query to the editor
You can check the https://github.com/raj-arun/fusionbimigrator repository to understand how to use "BI Publisher Catalog Webserices"
In addition to the Catalog Webservices we will need to use the ExternalReportWSSService web service to run a report and get the query back
We will use a standard data model and standard report in Oracle Fusion BI Catalog
Create a folder automatically when the connection is created in /Custom/NACFusionConnector (You can use catalog web services to do this)
