require 'dotenv/load'
require 'net/http'
require 'json'
require 'rubyxl'

class MatchUpdater
  API_URL = 'https://api.football-data.org/v4/competitions/WC/matches'
  API_KEY = ENV['FOOTBALL_DATA_KEY']

  def initialize(excel_path, sheet_name: nil)
    @excel_path = excel_path
    @sheet_name = sheet_name
    validate_api_key!
  end

  def update_match(row_number)
    workbook = open_workbook
    worksheet = select_worksheet(workbook)
    row_index = row_number - 1
    row = worksheet[row_index]
    raise "Row #{row_number} not found in worksheet" unless row

    match = fetch_match_by_row_index(row_index)
    write_match_row(row, match)
    workbook.write(@excel_path)

    match
  end

  private

  def validate_api_key!
    raise 'Set FOOTBALL_DATA_KEY in your environment first' unless API_KEY && !API_KEY.empty?
  end

  def open_workbook
    RubyXL::Parser.parse(@excel_path)
  end

  def select_worksheet(workbook)
    return workbook[@sheet_name] if @sheet_name
    workbook[0]
  end

  def fetch_match_by_row_index(row_index)
    matches = fetch_matches
    puts matches.inspect
    matches[row_index] || raise("No match data for row #{row_index + 1}")
  end

  def fetch_matches
    uri = URI(API_URL)
    request = Net::HTTP::Get.new(uri)
    request['X-Auth-Token'] = API_KEY

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      raise "API request failed: #{response.code} #{response.message}"
    end

    JSON.parse(response.body)['matches']
  end

  def write_match_row(row, match)
    row[0] ? row[0].change_contents(match.dig('homeTeam', 'name')) : row.add_cell(match.dig('homeTeam', 'name'))
    row[1] ? row[1].change_contents(match.dig('awayTeam', 'name')) : row.add_cell(match.dig('awayTeam', 'name'))
    row[2] ? row[2].change_contents(match['utcDate']) : row.add_cell(match['utcDate'])
    row[3] ? row[3].change_contents(match['status']) : row.add_cell(match['status'])

    full_time_score = [match.dig('score', 'fullTime', 'home'), match.dig('score', 'fullTime', 'away')].join('-')
    row[4] ? row[4].change_contents(full_time_score) : row.add_cell(full_time_score)
  end
end

if __FILE__ == $PROGRAM_NAME
  if ARGV.size < 2
    puts 'Usage: ruby match_updater.rb <excel_path> <row_number> [sheet_name]'
    exit 1
  end

  excel_path, row_number, sheet_name = ARGV
  updater = MatchUpdater.new(excel_path, sheet_name: sheet_name)
  match = updater.update_match(Integer(row_number))

  puts "Updated row #{row_number}: #{match.dig('homeTeam', 'name')} vs #{match.dig('awayTeam', 'name')}"
end