require 'mysql'
require 'csv'

con = Mysql.new 'localhost', 'root', 'root', 'hospital'

##Get the list of all diagnoses
diagRS = con.query 'SELECT code FROM diagnosis'
diagRows = diagRS.num_rows

##put them in an array that will be iterated through once per state
diagArray = Array.new
diagRows.times do
	diagArray.push(diagRS.fetch_row[0])
end

##Iterate through each state
CSV.foreach("../national/DRG-All.csv", {:headers=>:first_row}) do |row|
	state = row[0]
	puts state
	
	##iterate through each diagnosis
	diagArray.each { 
		|diagCode|

		##create a file for that state/DRG
		config_path = File.expand_path("../../national/" + state + "/DRG-" + diagCode + ".csv", __FILE__)
		outfile = File.open(config_path, 'w')

		rs = con.query 'SELECT p.city, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
			FROM provider p
			INNER JOIN inpatient i ON i.providerID = p.id
			INNER JOIN diagnosis d ON i.drgid = d.id
			WHERE d.code = \'' + diagCode + '\' AND p.state = \'' + state + '\'
			group by p.city'

		n_rows = rs.num_rows

		outfile.write("city,avgCoveredCharges,averagePayments")

	 	n_rows.times do
	        outfile.write("\n" + rs.fetch_row.join(","))
	    end

	    outfile.close
	}
end
con.close