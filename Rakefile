require 'jsmin'

file 'donatello.js'

task :minify => 'donatello.js' do
  File.open('donatello.min.js','w') do |file|
    file.write(JSMin.minify(File.read('donatello.js')))
  end
end

task :default => :minify
