require 'rubygems'
require 'mysql'
require 'csv'

##first, read the CSV of states and loop through each state
CSV.foreach("../national/DRG-All.csv", {:headers=>:first_row}) do |row|
	state = row[0]

	##create a directory for that state
	Dir.mkdir("../national/" + state) unless File.exists?("../national/" + state)

	##create a file for that states DRG all data
	config_path = File.expand_path("../../national/" + state + "/DRG-All.csv", __FILE__)

	outfile = File.open(config_path, 'w')

	con = Mysql.new 'localhost', 'root', 'root', 'hospital'

	rs = con.query 'SELECT REPLACE(p.city, \',\', \'\') city, ROUND(SUM(i.averageCoveredCharges * i.totalDischarges) / SUM(i.totalDischarges)) averageCoveredCharges,
	ROUND(SUM(i.averagePayments * i.totalDischarges) / SUM(i.totalDischarges)) averagePayments
	FROM provider p
	INNER JOIN inpatient i ON i.providerID = p.id
	WHERE p.state = \'' + state + '\'
	group by p.city;'

	n_rows = rs.num_rows

	outfile.write("city,avgCoveredCharges,averagePayments")

 	n_rows.times do
        outfile.write("\n" + rs.fetch_row.join(","))
    	end

	outfile.close
	end
