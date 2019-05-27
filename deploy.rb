#!/usr/bin/env ruby

require 'fileutils'
require_relative 'scripts/colors.rb'
require_relative 'scripts/version.rb'

puts "Please choose your #{green('environment')} !"
puts '1: Staging (default)'
puts '2: Production'

env = $stdin.gets.strip
env = (env == '2' ? 'production' : 'staging')

puts "Deploying #{green env} build..."

trap('INT') do
  puts "\r     \n#{yellow 'Deploy cancelled !'}"
  exit
end

def only_minor(version)
  return nil unless version

  version.split('.')[0..1].join('.')
end

def remove_old_tags(current_version)
  old_tags = `git tag -l 'v#{only_minor(current_version)}*'`.split("\n")
  old_tags.each do |t|
    puts "Deleting tag #{red t}..."
    `git push --delete origin #{t}`
    `git tag --delete #{t}`
  end
end

def build(version, env)
  domain = 'zgog.io'
  pre_cmd = if env == 'staging'
              "VERSION=#{version}-staging"
            else
              "VERSION=#{version}"
            end
  cmd = "#{pre_cmd} NO_VERBOSE_BUILD=true yarn build"
  puts "Running #{cmd}"
  system cmd
end

st = `git status`
if st =~ /Changes not staged for commit/
  puts "You have #{red 'unstaged changes'}, are you sure ? (CTRL-C to exit)"
  $stdin.gets
end

if st =~ /Untracked files/
  puts "You have #{yellow 'untracked files'}, are you sure ? (CTRL-C to exit)"
  $stdin.gets
end

puts cyan 'Fetching all...'
`git fetch --all`
`git tag -l | xargs git tag -d`
`git fetch --tags 2> /dev/null`

puts cyan 'Do you want to bump the version ? [Y/n]'

vbump = $stdin.gets.strip.casecmp('y').zero?
version = vbump ? set_new_version : current_version

puts "Deploying v#{cyan version} of app"
sleep 2

unless build(version, env)
  puts red 'Failed to build !'
  exit
end

print GREY

bucket = (env == 'staging' ? 'beta.zgog.io' : 'play.zgog.io')

system "gsutil -m rsync -d -r ./build gs://#{bucket}/"
print NC

puts

if env != 'staging'
  puts green "App v#{green version} has been deployed !"
  return unless vbump

  remove_old_tags(version)
  system "git tag v#{version}"
  system "git push origin v#{version}"
  puts
  puts green "Release/tag v#{version} created"
  puts "Env: #{cyan env} successfully deployed !"
else
  puts green 'Staging version has been successfully deployed'
end
