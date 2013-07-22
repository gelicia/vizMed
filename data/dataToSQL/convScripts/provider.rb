require "rubygems"
require "csv"

outfile = File.open("checkin.sql", 'w')

CSV.foreach("../csvFinal/provider.csv") do |row|
  providerId, providerName, providerStreetAddress, providerCity, providerState,
  providerZipCode, hospitalReferralRegionDescription = row

  providerName = providerName.gsub("'", "\\\\'")
  providerStreetAddress = providerStreetAddress.gsub("'", "\\\\'")
  providerCity = providerCity.gsub("'", "\\\\'")

  outfile.write("INSERT INTO provider (name, address, city, state, zip, region_id, national_id) SELECT '" +
  providerName + "', '" + providerStreetAddress + "', '" + providerCity + "', '" + providerState + "', '" + providerZipCode + 
  "', r.id, '" + providerId + "' " + 
  #why did i do this in sql, ugh 
  " FROM region r WHERE r.state = SUBSTRING('" + hospitalReferralRegionDescription + "', 1, 2) " + 
  " AND r.description = SUBSTRING('" + hospitalReferralRegionDescription + "', 6, LENGTH('" + hospitalReferralRegionDescription + "'));")

  outfile.write("\n")
end

outfile.close