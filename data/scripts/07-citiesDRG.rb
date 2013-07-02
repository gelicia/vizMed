##this takes a while to run, it would benefit from querying once per city 
## and splitting up the file creation from the result set

##even if a city has one provider, I don't want so much logic in the presentation layer
##because a multi-provider city can have a DRG that only one provider has done, and those are way different

##also, most cities have one provider, we could maybe write something in the presentation layer 
## to look for this data in the providernfile already generated in 04

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
##stopped in ohio, resume there
			##create a file for that city's DRG data
			config_path = File.expand_path("../../national/" + state + "/" + city + "/DRG-" + diagCode + ".csv", __FILE__)
			outfile = File.open(config_path, 'w')

			rs = con.query 'SELECT REPLACE(p.name, \',\', \'\') name, p.national_id, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
				FROM provider p
				INNER JOIN inpatient i ON i.providerID = p.id
				INNER JOIN diagnosis d ON i.drgid = d.id
				WHERE d.code = \'' + diagCode + '\' AND p.state = \'' + state + '\' AND p.city = \'' + city.gsub("'", "''") + '\'
				group by p.name'

			n_rows = rs.num_rows

			if n_rows > 0
				outfile.write("providerName,providerNationalID,avgCoveredCharges,averagePayments")

		 		n_rows.times do
		        	outfile.write("\n" + rs.fetch_row.join(","))
		    	end

				outfile.close
			else
				outfile.close
				File.delete(config_path)
			end
		}
	end
	
end
con.close