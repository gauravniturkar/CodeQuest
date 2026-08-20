import type { Step } from './types';

/** Used whenever the AI endpoint is unreachable, so the game never dead-ends. */
export const FALLBACK_QUESTIONS: Record<string, Step[]> = {
  variables: [
    {
      type: 'learn',
      title: 'What is a Variable?',
      body: 'A variable is a named container for data. Python is dynamically typed — you never declare the type, it is inferred from the value you assign.',
      code: 'name = "Ada"\nage  = 28\npi   = 3.14\nprint(name, age)  # Ada 28',
    },
    { type: 'quiz', q: 'Which is a valid variable name?', opts: ['2fast', 'my-var', '_count', 'my var'], answer: 2, explain: 'Names may start with a letter or underscore — no hyphens, no spaces, no leading digits.' },
    { type: 'fill', q: 'Store the string "Python" in a variable called lang:', answer: 'lang = "Python"', hint: 'Use the assignment operator =', explain: 'lang = "Python" binds the string to the name lang.' },
    { type: 'quiz', q: 'What does type("hello") return?', opts: ['str', 'string', 'text', 'char'], answer: 0, explain: "type() returns <class 'str'> — the built-in string type." },
    { type: 'quiz', q: 'What is x after this runs?', code: 'x = 5\nx = x + 3', opts: ['5', '3', '8', 'Error'], answer: 2, explain: 'The right side evaluates first: 5 + 3 = 8, then 8 is stored back into x.' },
  ],
  functions: [
    {
      type: 'learn',
      title: 'Defining Functions',
      body: 'Functions let you write code once and reuse it. Use def to define one and return to send a value back to the caller.',
      code: 'def add(a, b):\n    return a + b\n\nprint(add(3, 4))  # 7',
    },
    { type: 'quiz', q: 'What keyword defines a function in Python?', opts: ['function', 'define', 'def', 'fn'], answer: 2, explain: 'def is Python’s keyword for defining a function.' },
    { type: 'fill', q: 'What keyword sends a value back from a function?', answer: 'return', hint: 'Think "give back"', explain: 'return exits the function and hands the value to the caller.' },
    { type: 'quiz', q: 'What does this print?', code: 'def greet(name="World"):\n    print("Hello", name)\n\ngreet()', opts: ['Hello', 'Hello World', 'Error', 'Hello name'], answer: 1, explain: 'The default parameter "World" is used because no argument was passed.' },
    { type: 'quiz', q: 'A function with no return statement returns:', opts: ['None', '0', 'undefined', 'null'], answer: 0, explain: 'Python functions implicitly return None when no return statement runs.' },
  ],
  loops: [
    {
      type: 'learn',
      title: 'Loops in Python',
      body: 'for loops iterate over a sequence. while loops run until their condition turns False. break exits early, continue skips to the next pass.',
      code: 'for i in range(3):\n    print(i)  # 0, 1, 2\n\nx = 5\nwhile x > 0:\n    x -= 1',
    },
    { type: 'quiz', q: 'How many times does this loop run?', code: 'for i in range(1, 6):\n    ...', opts: ['4', '5', '6', '1'], answer: 1, explain: 'range(1, 6) yields 1, 2, 3, 4, 5 — five values. The stop value is excluded.' },
    { type: 'fill', q: 'What keyword skips the rest of the current iteration?', answer: 'continue', hint: 'The counterpart to break', explain: 'continue abandons the rest of the loop body and starts the next iteration.' },
    { type: 'quiz', q: 'What does break do in a loop?', opts: ['Skips the current step', 'Ends the loop entirely', 'Pauses execution', 'Raises an error'], answer: 1, explain: 'break terminates the loop immediately, no matter how many iterations remain.' },
    { type: 'quiz', q: 'What is the first line of output?', code: 'for i in enumerate(["a", "b"]):\n    print(i)', opts: ['a', '0', "(0, 'a')", "[0, 'a']"], answer: 2, explain: 'enumerate yields (index, value) tuples.' },
  ],
  conditionals: [
    {
      type: 'learn',
      title: 'if / elif / else',
      body: 'Conditionals branch on True/False. Python uses indentation to mark the block — there are no curly braces.',
      code: 'score = 75\nif score >= 90:\n    print("A")\nelif score >= 70:\n    print("B")  # runs\nelse:\n    print("C")',
    },
    { type: 'quiz', q: 'What does this print?', code: 'x = 10\nif x > 20:\n    print("Big")\nelif x > 5:\n    print("Med")\nelse:\n    print("Small")', opts: ['Big', 'Med', 'Small', 'Nothing'], answer: 1, explain: '10 > 20 is False, but 10 > 5 is True, so the elif branch runs.' },
    { type: 'fill', q: 'What operator checks equality?', answer: '==', hint: "Not = — that's assignment", explain: '== compares two values. = binds a value to a name.' },
    { type: 'quiz', q: 'What is result?', code: 'x = 5\nresult = x > 3 and x < 10', opts: ['True', 'False', '5', 'None'], answer: 0, explain: 'Both comparisons are True, so and yields True.' },
    { type: 'quiz', q: 'Which keyword inverts a boolean?', opts: ['not', 'no', '!', 'inv'], answer: 0, explain: 'not True is False, not False is True. Python spells it out rather than using !.' },
  ],
  lists: [
    {
      type: 'learn',
      title: 'Python Lists',
      body: 'Lists are ordered, mutable sequences. Index from 0, or use negative indices to count back from the end.',
      code: 'nums = [10, 20, 30]\nprint(nums[0])   # 10\nprint(nums[-1])  # 30\nnums.append(40)\nprint(len(nums)) # 4',
    },
    { type: 'quiz', q: 'What does this print?', code: 'items = ["a", "b", "c", "d"]\nprint(items[1:3])', opts: ["['a', 'b']", "['b', 'c']", "['b', 'c', 'd']", "['a', 'b', 'c']"], answer: 1, explain: 'A slice [1:3] takes indices 1 and 2 — the stop index is excluded.' },
    { type: 'fill', q: 'What method adds a single item to the end of a list?', answer: 'append', hint: 'It reads like plain English', explain: '.append(item) adds exactly one item to the end. .extend() adds many.' },
    { type: 'quiz', q: 'What does [x * 2 for x in range(3)] produce?', opts: ['[0, 1, 2]', '[0, 2, 4]', '[2, 4, 6]', '[1, 2, 3]'], answer: 1, explain: 'range(3) is 0, 1, 2 — doubling each gives [0, 2, 4].' },
    { type: 'quiz', q: 'What does sorted([3, 1, 2]) return?', opts: ['[3, 1, 2]', '[1, 2, 3]', '[3, 2, 1]', 'None'], answer: 1, explain: 'sorted() returns a new sorted list. .sort() sorts in place and returns None.' },
  ],
  oop: [
    {
      type: 'learn',
      title: 'Classes & Objects',
      body: 'A class is a blueprint; an object is one instance built from it. __init__ runs automatically at construction.',
      code: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n\n    def bark(self):\n        print(self.name, "says Woof!")\n\nd = Dog("Rex")\nd.bark()',
    },
    { type: 'quiz', q: 'What is the first parameter of any instance method?', opts: ['this', 'cls', 'self', 'me'], answer: 2, explain: 'self refers to the instance. It is a convention rather than a keyword, but always use it.' },
    { type: 'fill', q: 'Which method runs automatically when an object is created?', answer: '__init__', hint: 'Double underscore on both sides', explain: '__init__ is the initialiser, called every time you write ClassName(...).' },
    { type: 'quiz', q: 'What is inheritance?', opts: ['Copying a class', 'A subclass gaining features from a parent class', 'Hiding data', 'Making a singleton'], answer: 1, explain: 'Inheritance lets a child class reuse the attributes and methods of its parent.' },
    { type: 'quiz', q: 'What does class B(A): mean?', opts: ['B is nested in A', 'B inherits from A', 'B replaces A', 'B imports A'], answer: 1, explain: 'The parentheses after the class name declare the base class.' },
  ],
  apis: [
    {
      type: 'learn',
      title: 'Working with APIs',
      body: 'APIs let programs talk to each other over HTTP. The requests library makes this straightforward in Python — always check the status code before trusting the body.',
      code: 'import requests\n\nres = requests.get("https://api.example.com/data")\nprint(res.status_code)  # 200\ndata = res.json()       # dict',
    },
    { type: 'quiz', q: 'HTTP status code 200 means:', opts: ['Not found', 'Server error', 'OK / Success', 'Unauthorized'], answer: 2, explain: '200 OK is the standard success response. 404 Not Found, 500 Server Error, 401 Unauthorized.' },
    { type: 'fill', q: 'Which Python library is most commonly used for HTTP requests?', answer: 'requests', hint: 'It is named after the action itself', explain: 'requests is the de facto standard. Install it with: pip install requests' },
    { type: 'quiz', q: 'res.json() converts the response body into:', opts: ['a string', 'a list only', 'a Python dict or list', 'raw bytes'], answer: 2, explain: '.json() parses the body as JSON and returns the equivalent Python structure.' },
    { type: 'quiz', q: 'Which HTTP method creates a new resource?', opts: ['GET', 'POST', 'DELETE', 'PATCH'], answer: 1, explain: 'POST creates. GET reads, PATCH partially updates, DELETE removes.' },
  ],
};
