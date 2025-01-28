from openai import OpenAI

client = OpenAI(
  api_key="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"
)

completion = client.chat.completions.create(
  model="gpt-4o-mini",
  store=True,
  messages=[
    {"role": "user", "content": "write a haiku about ai"}
  ]
)

print(completion.choices[0].message)