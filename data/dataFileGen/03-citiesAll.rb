require 'mysql'
require 'csv'

##first, read the CSV of states and loop through each state
CSV.foreach("../national/DRG-All.csv", {:headers=>:first_row}) do |stateRow|
	state = stateRow[0]
	puts state
	##second, go into the directory for that state and get the DRG-All.csv for it, and then loop through the cities
	CSV.foreach("../national/" + state + "/DRG-All.csv", {:headers=>:first_row}) do |cityRow|
		city = cityRow[0]

		##create a directory for that city
		Dir.mkdir("../national/" + state + "/" + city) unless File.exists?("../national/" + state + "/" + city)

		##create a file for that city's DRG all data
		config_path = File.expand_path("../../national/" + state + "/" + city + "/DRG-All.csv", __FILE__)

		outfile = File.open(config_path, 'w')

		con = Mysql.new 'localhost', 'root', 'root', 'hospital'

		rs = con.query 'SELECT REPLACE(p.name, \',\', \'\') name, p.national_id, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
			FROM provider p
			INNER JOIN inpatient i ON i.providerID = p.id
			WHERE p.state = \'' + state + '\' AND p.city = \'' + city.gsub("'", "''") + '\'
			GROUP BY p.name;'

		n_rows = rs.num_rows

		outfile.write("providerName,providerNationalID,avgCoveredCharges,averagePayments")

 		n_rows.times do
        	outfile.write("\n" + rs.fetch_row.join(","))
    	end

    	con.close
		outfile.close
	end
end
