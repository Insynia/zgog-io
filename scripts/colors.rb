GREY = "\e[38;5;247m".freeze
GREEN = "\e[0;92m".freeze
YELLOW = "\e[0;93m".freeze
CYAN = "\e[0;96m".freeze
RED = "\e[0;91m".freeze
NC = "\e[0m".freeze # No Color

def green(str)
  "#{GREEN}#{str}#{NC}"
end

def red(str)
  "#{RED}#{str}#{NC}"
end

def cyan(str)
  "#{CYAN}#{str}#{NC}"
end

def grey(str)
  "#{GREY}#{str}#{NC}"
end

def yellow(str)
  "#{YELLOW}#{str}#{NC}"
end
