require 'mysql'

config_path = File.expand_path("../../national/DRG-All.csv", __FILE__)

outfile = File.open(config_path, 'w')

con = Mysql.new 'localhost', 'root', 'root', 'hospital'
rs = con.query 'SELECT p.state, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
FROM provider p INNER JOIN inpatient i ON i.providerID = p.id GROUP BY p.state;'

n_rows = rs.num_rows

outfile.write("state,avgCoveredCharges,averagePayments")

 n_rows.times do
        outfile.write("\n" + rs.fetch_row.join(","))
    end

outfile.close