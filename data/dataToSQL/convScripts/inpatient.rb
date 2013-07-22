require "rubygems"
require "csv"

outfile = File.open("inpatient.sql", 'w')

CSV.foreach("../orig/Medicare_Provider_Charge_Inpatient_DRG100_FY2011.csv") do |row|
  drgDefinition, providerId, providerName, providerStreetAddress,providerCity, providerState,
  providerZipCode, hospitalReferralRegionDescription, totalDischarges, averageCoveredCharges, 
  averageTotalPayments  = row

  outfile.write("INSERT INTO inpatient (drgID, providerID, totalDischarges, averageCoveredCharges, averagePayments) SELECT " +
    " d.id, p.id, " + totalDischarges + ", " + averageCoveredCharges + ", " + averageTotalPayments + 
    " FROM diagnosis d " +
    " INNER JOIN provider p ON p.national_id = " + providerId + 
    " WHERE d.code = " + drgDefinition[0,3] + ";")

  outfile.write("\n")

end

outfile.close