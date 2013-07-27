require 'mysql'

con = Mysql.new 'localhost', 'root', 'root', 'hospital'

##Get the list of all diagnoses (since this is national level, they should all be used at least once)
diagRS = con.query 'SELECT code FROM diagnosis'

diagRows = diagRS.num_rows

##iterate through them
diagRows.times do
	diagCode = diagRS.fetch_row[0]

	##create a file for that diagnosis
	config_path = File.expand_path("../../national/DRG-" + diagCode + ".csv", __FILE__)
	outfile = File.open(config_path, 'w')

	rs = con.query 'SELECT p.state, ROUND(SUM(i.averageCoveredCharges * i.totalDischarges) / SUM(i.totalDischarges)) averageCoveredCharges,
		ROUND(SUM(i.averagePayments * i.totalDischarges) / SUM(i.totalDischarges)) averagePayments
		FROM provider p
		INNER JOIN inpatient i ON i.providerID = p.id
		INNER JOIN diagnosis d ON i.drgid = d.id
		WHERE d.code = \'' + diagCode + '\'
		group by p.state'

	n_rows = rs.num_rows

	outfile.write("state,avgCoveredCharges,averagePayments")

 	n_rows.times do
        outfile.write("\n" + rs.fetch_row.join(","))
    end
    
	outfile.close
end

con.close