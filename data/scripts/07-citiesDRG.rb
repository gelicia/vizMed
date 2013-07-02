require 'mysql'
require 'csv'

con = Mysql.new 'localhost', 'root', 'root', 'hospital'

##Get the list of all diagnoses
diagRS = con.query 'SELECT code FROM diagnosis'
diagRows = diagRS.num_rows

##put them in an array that will be iterated through once per state/city
diagArray = Array.new
diagRows.times do
	diagArray.push(diagRS.fetch_row[0])
end

##Iterate through each state
CSV.foreach("../national/DRG-All.csv", {:headers=>:first_row}) do |stateRow|
	state = stateRow[0]
	puts state

	##Iterate through each city 
	CSV.foreach("../national/" + state + "/DRG-All.csv", {:headers=>:first_row}) do |cityRow|
		city = cityRow[0]

		##iterate through each diagnosis
		diagArray.each { 
			|diagCode|

		}
	end
	
end
con.close