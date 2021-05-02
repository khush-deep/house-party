from django.core.serializers import serialize

def custom_serializer(query_list, fields=None, primary_key=None):
    list = serialize('python', query_list, fields=fields)
    for i in range(len(list)):
        id = list[i]["pk"]
        list[i] = list[i].get("fields")
        list[i]["id"] = id
        if primary_key:
            list[i][primary_key] = id
    return list