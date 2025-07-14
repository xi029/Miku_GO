from zhipuai import ZhipuAI

client = ZhipuAI(api_key="87021842e8f348f9a0426c26f9c6cfdc.jtwuz3s0sMFag1NX") # 请填写您自己的APIKey

tools = [
    {
        "type": "function",
        "function": {
            "name": "query_train_info",
            "description": "根据用户提供的信息查询火车时刻",
            "parameters": {
                "type": "object",
                "properties": {
                    "departure": {
                        "type": "string",
                        "description": "出发城市或车站",
                    },
                    "destination": {
                        "type": "string",
                        "description": "目的地城市或车站",
                    },
                    "date": {
                        "type": "string",
                        "description": "要查询的火车日期",
                    },
                },
                "required": ["departure", "destination", "date"],
            },
        }
    }
]
messages = [
    {
        "role": "user",
        "content": "你能帮我查一下2024年1月1日从北京南站到上海的火车票吗？"
    }
]
response = client.chat.completions.create(
    model="glm-4-flash", # 请填写您要调用的模型名称
    messages=messages,
    tools=tools,
    tool_choice="auto",
)
print(response)