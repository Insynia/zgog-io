#!/usr/bin/env ruby

trap('INT') do
  puts "\r     \nCancelled !"
  exit
end

type = 'watch' if ARGV.join(' ').include?('--watch')
type = 'build' if ARGV.join(' ').include?('--build')

unless type
  puts 'Choose the type of build'
  puts '1: Watch (default)'
  puts '2: Build'
  type = $stdin.gets.chomp

  type = type == '2' ? 'build' : 'watch'
end

def generate_zip(out_folder)
  zip = File.expand_path('../extension.zip', __dir__)

  `rm -f #{zip}`
  `zip -r #{zip} #{out_folder}`
end

def build(type = 'build')
  content_entry = File.expand_path('./src/index.html', __dir__)
  tiles = Dir.glob(File.expand_path('./src/assets/tiles/', __dir__) + '/*')
  other_assets = Dir.glob(File.expand_path('./src/assets/', __dir__) + '/*.*')
  out_folder = File.expand_path(type == 'watch' ? './dist/' : './build/', __dir__)

  build_cmd = "parcel #{type == 'watch' ? '' : type} #{content_entry} -d #{out_folder}".freeze

  tiles_cmd = "cp #{[tiles + other_assets].join(' ')} #{out_folder}".freeze

  spawn tiles_cmd
  `#{build_cmd}`
  generate_zip(out_folder) if type == 'build'
  puts 'Build done.'
end

build(type)
