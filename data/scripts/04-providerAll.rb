require 'mysql'
require 'csv'

i = 0

##first, read the CSV of states and loop through each state
CSV.foreach("../national/DRG-All.csv", {:headers=>:first_row}) do |stateRow|
	state = stateRow[0]
	puts state

	##second, go into the directory for that state and get the DRG-All.csv for it, and then loop through the cities
	CSV.foreach("../national/" + state + "/DRG-All.csv", {:headers=>:first_row}) do |cityRow|
		city = cityRow[0]

		##create a directory for the provider information of that city
		##provider level will have all DRGs (no use for constant one line bar charts of 1 prov/1 drg)
		Dir.mkdir("../national/" + state + "/" + city + "/providers") unless File.exists?("../national/" + state + "/" + city + "/providers")

		##thirdly, loop through the providers in that city, then provide a breakdown of DRGs in that provider
		CSV.foreach("../national/" + state + "/" + city + "/DRG-All.csv", {:headers=>:first_row}) do |provRow|
			providerID = provRow[1]
			
			##create a file for that provider's DRG 
			config_path = File.expand_path("../../national/" + state + "/" + city + "/providers/" + providerID + "-DRGs.csv", __FILE__)
			outfile = File.open(config_path, 'w')

			con = Mysql.new 'localhost', 'root', 'root', 'hospital'

			rs = con.query 'SELECT REPLACE(d.description, \',\', \'\') description, d.code, ROUND(avg(i.averageCoveredCharges)) averageCoveredCharges, ROUND(avg(i.averagePayments)) averagePayments
				FROM provider p
				INNER JOIN inpatient i ON i.providerID = p.id
				INNER JOIN diagnosis d ON i.drgid = d.id
				WHERE p.state = \'' + state + '\' AND p.city = \'' + city.gsub("'", "''") + '\' AND p.national_id = \'' + providerID + '\'
				group by d.description'

			n_rows = rs.num_rows

			outfile.write("description,code,avgCoveredCharges,averagePayments")

	 		n_rows.times do
	        	outfile.write("\n" + rs.fetch_row.join(","))
	    	end

	    	con.close
			outfile.close
		end
	end
end
